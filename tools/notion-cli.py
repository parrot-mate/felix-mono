#!/usr/bin/env python3
import argparse
import json
import os
import re
import sys
import urllib.error
import urllib.request


NOTION_API_BASE = "https://api.notion.com/v1"
DEFAULT_ENV_PATH = os.path.join(os.path.dirname(__file__), ".env.local")


def _load_env_file(path):
    if not os.path.isfile(path):
        return

    with open(path, "r", encoding="utf-8") as handle:
        for raw_line in handle:
            line = raw_line.strip()
            if not line or line.startswith("#"):
                continue
            if "=" not in line:
                continue
            key, value = line.split("=", 1)
            key = key.strip()
            value = value.strip().strip('"').strip("'")
            if key and key not in os.environ:
                os.environ[key] = value


def _request(method, url, token, notion_version, payload=None):
    headers = {
        "Authorization": f"Bearer {token}",
        "Notion-Version": notion_version,
        "Content-Type": "application/json",
    }
    data = None if payload is None else json.dumps(payload).encode("utf-8")
    req = urllib.request.Request(url, data=data, method=method, headers=headers)
    try:
        with urllib.request.urlopen(req) as resp:
            body = resp.read().decode("utf-8")
            return json.loads(body) if body else {}
    except urllib.error.HTTPError as exc:
        body = exc.read().decode("utf-8")
        raise RuntimeError(f"Notion API error {exc.code}: {body}") from exc


def _text_rich(content):
    return [{"type": "text", "text": {"content": content}}]


def _paragraph_block(content):
    return {"object": "block", "type": "paragraph", "paragraph": {"rich_text": _text_rich(content)}}


def _heading_block(level, content):
    block_type = f"heading_{level}"
    return {"object": "block", "type": block_type, block_type: {"rich_text": _text_rich(content)}}


def _bulleted_block(content):
    return {
        "object": "block",
        "type": "bulleted_list_item",
        "bulleted_list_item": {"rich_text": _text_rich(content)},
    }


def _numbered_block(content):
    return {
        "object": "block",
        "type": "numbered_list_item",
        "numbered_list_item": {"rich_text": _text_rich(content)},
    }


def _code_block(content, language):
    lang = language if language else "plain text"
    return {
        "object": "block",
        "type": "code",
        "code": {"rich_text": _text_rich(content), "language": lang},
    }


def _markdown_to_blocks(markdown_text):
    lines = markdown_text.splitlines()
    blocks = []
    in_code = False
    code_lang = ""
    code_lines = []

    for line in lines:
        if in_code:
            if line.strip().startswith("```"):
                blocks.append(_code_block("\n".join(code_lines), code_lang))
                in_code = False
                code_lang = ""
                code_lines = []
            else:
                code_lines.append(line)
            continue

        if line.strip().startswith("```"):
            in_code = True
            code_lang = line.strip()[3:].strip()
            continue

        if not line.strip():
            continue

        if line.startswith("# "):
            blocks.append(_heading_block(1, line[2:].strip()))
        elif line.startswith("## "):
            blocks.append(_heading_block(2, line[3:].strip()))
        elif line.startswith("### "):
            blocks.append(_heading_block(3, line[4:].strip()))
        elif line.startswith("- ") or line.startswith("* "):
            blocks.append(_bulleted_block(line[2:].strip()))
        elif re.match(r"^\d+\.\s+", line):
            blocks.append(_numbered_block(re.sub(r"^\d+\.\s+", "", line).strip()))
        else:
            blocks.append(_paragraph_block(line.strip()))

    if in_code:
        blocks.append(_code_block("\n".join(code_lines), code_lang))

    return blocks


def _chunked(items, size):
    for i in range(0, len(items), size):
        yield items[i : i + size]


def _normalize_notion_id(value):
    if not value:
        return value
    cleaned = value.strip()
    hex_match = re.search(r"([0-9a-fA-F]{32})", cleaned.replace("-", ""))
    if not hex_match:
        return value
    raw = hex_match.group(1).lower()
    return f"{raw[0:8]}-{raw[8:12]}-{raw[12:16]}-{raw[16:20]}-{raw[20:32]}"


def _create_page(token, notion_version, parent, title, title_property, blocks):
    payload = {"parent": parent, "properties": {}}

    title_block = {"title": _text_rich(title)}
    if "database_id" in parent:
        payload["properties"][title_property] = title_block
    else:
        payload["properties"]["title"] = title_block

    if blocks:
        payload["children"] = blocks[:100]

    response = _request("POST", f"{NOTION_API_BASE}/pages", token, notion_version, payload)
    page_id = response.get("id")
    page_url = response.get("url")

    remaining = blocks[100:]
    for chunk in _chunked(remaining, 100):
        _request(
            "PATCH",
            f"{NOTION_API_BASE}/blocks/{page_id}/children",
            token,
            notion_version,
            {"children": chunk},
        )

    return page_id, page_url


def _list_block_children(token, notion_version, block_id):
    children = []
    cursor = None
    while True:
        query = f"?page_size=100{f'&start_cursor={cursor}' if cursor else ''}"
        response = _request(
            "GET",
            f"{NOTION_API_BASE}/blocks/{block_id}/children{query}",
            token,
            notion_version,
        )
        children.extend(response.get("results", []))
        if not response.get("has_more"):
            break
        cursor = response.get("next_cursor")
        if not cursor:
            break
    return children


def _clear_block_children(token, notion_version, block_id):
    children = _list_block_children(token, notion_version, block_id)
    for child in children:
        child_id = child.get("id")
        if child_id:
            _request(
                "DELETE",
                f"{NOTION_API_BASE}/blocks/{child_id}",
                token,
                notion_version,
            )


def _append_block_children(token, notion_version, block_id, blocks):
    for chunk in _chunked(blocks, 100):
        _request(
            "PATCH",
            f"{NOTION_API_BASE}/blocks/{block_id}/children",
            token,
            notion_version,
            {"children": chunk},
        )


def _update_page(token, notion_version, page_id, title, blocks):
    _clear_block_children(token, notion_version, page_id)
    if title:
        _request(
            "PATCH",
            f"{NOTION_API_BASE}/pages/{page_id}",
            token,
            notion_version,
            {"properties": {"title": {"title": _text_rich(title)}}},
        )
    _append_block_children(token, notion_version, page_id, blocks)
    response = _request(
        "GET",
        f"{NOTION_API_BASE}/pages/{page_id}",
        token,
        notion_version,
    )
    return response.get("id"), response.get("url")


def main():
    parser = argparse.ArgumentParser(description="Create a Notion page from a markdown file.")
    parser.add_argument(
        "--env-file",
        default=DEFAULT_ENV_PATH,
        help="Path to env file (default: tools/.env.local).",
    )
    parser.add_argument("--markdown", required=True, help="Path to the markdown file.")
    parser.add_argument("--title", help="Page title. Defaults to markdown filename.")
    parser.add_argument("--page-id", help="Update an existing page by ID.")
    parser.add_argument("--parent-page-id", help="Parent page ID.")
    parser.add_argument("--database-id", help="Database ID (if creating inside a database).")
    parser.add_argument(
        "--title-property",
        default=os.getenv("NOTION_TITLE_PROPERTY", "Name"),
        help="Database title property name (default: Name).",
    )
    parser.add_argument(
        "--token",
        default=os.getenv("NOTION_TOKEN"),
        help="Notion integration token (or set NOTION_TOKEN).",
    )
    parser.add_argument(
        "--notion-version",
        default=os.getenv("NOTION_VERSION", "2022-06-28"),
        help="Notion API version (default: 2022-06-28).",
    )

    args = parser.parse_args()
    _load_env_file(args.env_file)
    if not args.token:
        args.token = os.getenv("NOTION_TOKEN")

    if not args.token:
        print("Missing Notion token. Provide --token or set NOTION_TOKEN.", file=sys.stderr)
        return 2

    if bool(args.parent_page_id) == bool(args.database_id):
        if not args.page_id:
            print("Provide exactly one of --parent-page-id or --database-id.", file=sys.stderr)
            return 2

    if not os.path.isfile(args.markdown):
        print(f"Markdown file not found: {args.markdown}", file=sys.stderr)
        return 2

    title = args.title or os.path.splitext(os.path.basename(args.markdown))[0]

    with open(args.markdown, "r", encoding="utf-8") as handle:
        markdown_text = handle.read()

    blocks = _markdown_to_blocks(markdown_text)

    if args.page_id:
        page_id, page_url = _update_page(
            token=args.token,
            notion_version=args.notion_version,
            page_id=_normalize_notion_id(args.page_id),
            title=title,
            blocks=blocks,
        )
    else:
        if args.parent_page_id:
            parent = {"page_id": _normalize_notion_id(args.parent_page_id)}
        else:
            parent = {"database_id": _normalize_notion_id(args.database_id)}

        page_id, page_url = _create_page(
            token=args.token,
            notion_version=args.notion_version,
            parent=parent,
            title=title,
            title_property=args.title_property,
            blocks=blocks,
        )

    print(f"Created page {page_id}")
    if page_url:
        print(page_url)

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
