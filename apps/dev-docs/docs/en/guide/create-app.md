# Create App

Use the pmate CLI to create an app by first choosing the app type, then following the matching init and deploy guide.

## Table of Contents

- [Background](#background)
- [Choose the app type first](#choose-the-app-type-first)
- [Open the matching guide](#open-the-matching-guide)

## Background

Creating an app is more than just running code locally. It also includes app structure, infrastructure initialization, deployment flow, and how the app is published or exposed after deployment. Those steps differ by app type: Node and Rust usually behave like services, while Vite and static apps are published as build artifacts through OSS/CDN.

Because of that, the docs now group Node, Vite, static, and Rust under one entry point: `Create App`. Start by deciding what kind of app you are building, then jump to the matching guide instead of guessing from several separate navigation items.

## Choose the app type first

- `Node`: a long-running service that listens on a port and runs on a server.
- `Vite`: a frontend app that builds into static assets and is hosted through OSS/CDN.
- `Static`: a pure static site or asset bundle without a Vite build pipeline.
- `Rust`: a Rust service that usually needs a server, process management, and reverse proxy.

If you have not decided the repo layout yet, read this first:

- [Monorepo app & tech stack](/guide/mono-app-structure)

## Open the matching guide

- [Init and deploy a Node app](/guide/init-deploy-node)
- [Init and deploy a Vite app](/guide/init-deploy-vite)
- [Init and deploy a static app](/guide/init-deploy-static)
- [Init and deploy a Rust app](/guide/init-deploy-rust)
