import{j as e}from"./iframe-aH6RCRiI.js";import{B as v}from"./BlueprintButton-songOEbk.js";import{B as q}from"./BlueprintPanel-CVAXEfCq.js";import{B as f}from"./BlueprintStageCard-BT7LeeRY.js";import{B as b}from"./BlueprintDocActionsModule-DxJE9OeZ.js";import{B as x}from"./BlueprintSummaryModule-Cl86bbnV.js";function k({id:m,name:t,label:i,hint:u,placeholder:d,kind:o="text",multiline:p,required:c,readOnly:l=!1,options:r=[],value:s="",onChange:n}){const y=o==="textarea"||p?"textarea":o,g=m??t??`bp-field-${i.replace(/\s+/g,"-").toLowerCase()}`;return e.jsxs("label",{className:"bp-field",htmlFor:g,children:[e.jsxs("span",{className:"bp-field__label",children:[i,c?e.jsx("span",{className:"bp-field__required",children:"*"}):null]}),y==="textarea"?e.jsx("textarea",{id:g,name:t,"aria-label":i,readOnly:l,className:"bp-field__control bp-field__control--textarea",placeholder:d,value:s,onChange:a=>n==null?void 0:n(a.target.value)}):y==="select"?e.jsx("select",{id:g,name:t,"aria-label":i,disabled:l,className:"bp-field__control",value:s,onChange:a=>n==null?void 0:n(a.target.value),children:r.map(a=>e.jsx("option",{value:a.value,children:a.label},a.value))}):e.jsx("input",{id:g,name:t,"aria-label":i,readOnly:l,className:"bp-field__control",placeholder:d,value:s,onChange:a=>n==null?void 0:n(a.target.value)}),u?e.jsx("span",{className:"bp-field__hint",children:u}):null]})}k.__docgenInfo={description:"",methods:[],displayName:"BlueprintField",props:{id:{required:!1,tsType:{name:"string"},description:""},name:{required:!1,tsType:{name:"string"},description:""},label:{required:!0,tsType:{name:"string"},description:""},hint:{required:!1,tsType:{name:"string"},description:""},placeholder:{required:!1,tsType:{name:"string"},description:""},kind:{required:!1,tsType:{name:"union",raw:'"text" | "textarea" | "select"',elements:[{name:"literal",value:'"text"'},{name:"literal",value:'"textarea"'},{name:"literal",value:'"select"'}]},description:"",defaultValue:{value:'"text"',computed:!1}},multiline:{required:!1,tsType:{name:"boolean"},description:""},required:{required:!1,tsType:{name:"boolean"},description:""},readOnly:{required:!1,tsType:{name:"boolean"},description:"",defaultValue:{value:"false",computed:!1}},options:{required:!1,tsType:{name:"Array",elements:[{name:"signature",type:"object",raw:"{ value: string; label: string }",signature:{properties:[{key:"value",value:{name:"string",required:!0}},{key:"label",value:{name:"string",required:!0}}]}}],raw:"Array<{ value: string; label: string }>"},description:"",defaultValue:{value:"[]",computed:!1}},value:{required:!1,tsType:{name:"string"},description:"",defaultValue:{value:'""',computed:!1}},onChange:{required:!1,tsType:{name:"signature",type:"function",raw:"(value: string) => void",signature:{arguments:[{type:{name:"string"},name:"value"}],return:{name:"void"}}},description:""}}};function j({eyebrow:m,title:t,subtitle:i,isDesktop:u=!0,stages:d,sections:o,summary:p,reviewDocs:c,formalDocs:l}){return e.jsx("main",{className:u?"bp-page bp-page--desktop":"bp-page",children:e.jsxs("div",{className:"bp-stack",children:[e.jsxs("section",{className:"bp-hero",children:[e.jsx("p",{className:"bp-eyebrow",children:m}),e.jsx("h1",{className:"bp-title",children:t}),e.jsx("p",{className:"bp-subtitle",children:i})]}),e.jsx("section",{className:"bp-grid bp-grid--stages",children:d.map(r=>e.jsx(f,{...r},r.title))}),e.jsxs("section",{className:"bp-grid bp-grid--main",children:[e.jsx("div",{className:"bp-stack",children:e.jsx(q,{title:"关键字段录入",description:"先收集完整的结构化输入，再触发后续 AI 派生。",children:e.jsxs("div",{className:"bp-stack",children:[o.map(r=>e.jsxs("div",{className:"bp-section-card",children:[e.jsx("p",{className:"bp-panel__title",children:r.title}),e.jsx("p",{className:"bp-panel__meta",children:r.description}),e.jsx("div",{style:{height:16}}),e.jsx("div",{className:"bp-stack",children:r.fields.map(s=>e.jsx(k,{...s},s.id))})]},r.id)),e.jsxs("div",{className:"bp-actions",children:[e.jsx(v,{children:"提交结构化输入"}),e.jsx(v,{variant:"secondary",children:"保存草稿"})]})]})})}),e.jsxs("aside",{className:"bp-stack",children:[e.jsx("div",{className:"bp-status bp-status--success",children:"前端已直连 agent，当前可以继续生成摘要、Review Docs 和 Formal Specs。"}),e.jsx(x,{...p}),e.jsx(b,{...c}),e.jsx(b,{...l})]})]})]})})}j.__docgenInfo={description:"",methods:[],displayName:"BlueprintWorkspacePage",props:{eyebrow:{required:!0,tsType:{name:"string"},description:""},title:{required:!0,tsType:{name:"string"},description:""},subtitle:{required:!0,tsType:{name:"string"},description:""},isDesktop:{required:!1,tsType:{name:"boolean"},description:"",defaultValue:{value:"true",computed:!1}},stages:{required:!0,tsType:{name:"Array",elements:[{name:"signature",type:"object",raw:`{
  title: string
  description: string
  status: string
  active?: boolean
  disabled?: boolean
  onClick?: () => void
}`,signature:{properties:[{key:"title",value:{name:"string",required:!0}},{key:"description",value:{name:"string",required:!0}},{key:"status",value:{name:"string",required:!0}},{key:"active",value:{name:"boolean",required:!1}},{key:"disabled",value:{name:"boolean",required:!1}},{key:"onClick",value:{name:"signature",type:"function",raw:"() => void",signature:{arguments:[],return:{name:"void"}},required:!1}}]}}],raw:"BlueprintStageCardProps[]"},description:""},sections:{required:!0,tsType:{name:"Array",elements:[{name:"signature",type:"object",raw:`{
  id: string
  title: string
  description: string
  fields: Array<{
    id: string
    label: string
    hint?: string
    placeholder?: string
    kind?: "text" | "textarea" | "select"
    multiline?: boolean
    options?: Array<{ value: string; label: string }>
    required?: boolean
    readOnly?: boolean
    value?: string
    onChange?: (value: string) => void
  }>
}`,signature:{properties:[{key:"id",value:{name:"string",required:!0}},{key:"title",value:{name:"string",required:!0}},{key:"description",value:{name:"string",required:!0}},{key:"fields",value:{name:"Array",elements:[{name:"signature",type:"object",raw:`{
  id: string
  label: string
  hint?: string
  placeholder?: string
  kind?: "text" | "textarea" | "select"
  multiline?: boolean
  options?: Array<{ value: string; label: string }>
  required?: boolean
  readOnly?: boolean
  value?: string
  onChange?: (value: string) => void
}`,signature:{properties:[{key:"id",value:{name:"string",required:!0}},{key:"label",value:{name:"string",required:!0}},{key:"hint",value:{name:"string",required:!1}},{key:"placeholder",value:{name:"string",required:!1}},{key:"kind",value:{name:"union",raw:'"text" | "textarea" | "select"',elements:[{name:"literal",value:'"text"'},{name:"literal",value:'"textarea"'},{name:"literal",value:'"select"'}],required:!1}},{key:"multiline",value:{name:"boolean",required:!1}},{key:"options",value:{name:"Array",elements:[{name:"signature",type:"object",raw:"{ value: string; label: string }",signature:{properties:[{key:"value",value:{name:"string",required:!0}},{key:"label",value:{name:"string",required:!0}}]}}],raw:"Array<{ value: string; label: string }>",required:!1}},{key:"required",value:{name:"boolean",required:!1}},{key:"readOnly",value:{name:"boolean",required:!1}},{key:"value",value:{name:"string",required:!1}},{key:"onChange",value:{name:"signature",type:"function",raw:"(value: string) => void",signature:{arguments:[{type:{name:"string"},name:"value"}],return:{name:"void"}},required:!1}}]}}],raw:`Array<{
  id: string
  label: string
  hint?: string
  placeholder?: string
  kind?: "text" | "textarea" | "select"
  multiline?: boolean
  options?: Array<{ value: string; label: string }>
  required?: boolean
  readOnly?: boolean
  value?: string
  onChange?: (value: string) => void
}>`,required:!0}}]}}],raw:"BlueprintWorkspaceSection[]"},description:""},summary:{required:!0,tsType:{name:"signature",type:"object",raw:`{
  structuredScore: number
  summary: string
  keyQuestions: string[]
  suggestions: BlueprintSuggestion[]
}`,signature:{properties:[{key:"structuredScore",value:{name:"number",required:!0}},{key:"summary",value:{name:"string",required:!0}},{key:"keyQuestions",value:{name:"Array",elements:[{name:"string"}],raw:"string[]",required:!0}},{key:"suggestions",value:{name:"Array",elements:[{name:"signature",type:"object",raw:`{
  key: string
  title: string
  reason: string
  ctaLabel?: string
  onClick?: () => void
}`,signature:{properties:[{key:"key",value:{name:"string",required:!0}},{key:"title",value:{name:"string",required:!0}},{key:"reason",value:{name:"string",required:!0}},{key:"ctaLabel",value:{name:"string",required:!1}},{key:"onClick",value:{name:"signature",type:"function",raw:"() => void",signature:{arguments:[],return:{name:"void"}},required:!1}}]}}],raw:"BlueprintSuggestion[]",required:!0}}]}},description:""},reviewDocs:{required:!0,tsType:{name:"signature",type:"object",raw:`{
  title: string
  actions: Array<{
    key: string
    label: string
    disabled?: boolean
    loading?: boolean
    onClick?: () => void
  }>
  activeFile?: string
  files: Array<{
    key: string
    label: string
    disabled?: boolean
    onClick?: () => void
  }>
  helperText?: string
}`,signature:{properties:[{key:"title",value:{name:"string",required:!0}},{key:"actions",value:{name:"Array",elements:[{name:"signature",type:"object",raw:`{
  key: string
  label: string
  disabled?: boolean
  loading?: boolean
  onClick?: () => void
}`,signature:{properties:[{key:"key",value:{name:"string",required:!0}},{key:"label",value:{name:"string",required:!0}},{key:"disabled",value:{name:"boolean",required:!1}},{key:"loading",value:{name:"boolean",required:!1}},{key:"onClick",value:{name:"signature",type:"function",raw:"() => void",signature:{arguments:[],return:{name:"void"}},required:!1}}]}}],raw:`Array<{
  key: string
  label: string
  disabled?: boolean
  loading?: boolean
  onClick?: () => void
}>`,required:!0}},{key:"activeFile",value:{name:"string",required:!1}},{key:"files",value:{name:"Array",elements:[{name:"signature",type:"object",raw:`{
  key: string
  label: string
  disabled?: boolean
  onClick?: () => void
}`,signature:{properties:[{key:"key",value:{name:"string",required:!0}},{key:"label",value:{name:"string",required:!0}},{key:"disabled",value:{name:"boolean",required:!1}},{key:"onClick",value:{name:"signature",type:"function",raw:"() => void",signature:{arguments:[],return:{name:"void"}},required:!1}}]}}],raw:`Array<{
  key: string
  label: string
  disabled?: boolean
  onClick?: () => void
}>`,required:!0}},{key:"helperText",value:{name:"string",required:!1}}]}},description:""},formalDocs:{required:!0,tsType:{name:"signature",type:"object",raw:`{
  title: string
  actions: Array<{
    key: string
    label: string
    disabled?: boolean
    loading?: boolean
    onClick?: () => void
  }>
  activeFile?: string
  files: Array<{
    key: string
    label: string
    disabled?: boolean
    onClick?: () => void
  }>
  helperText?: string
}`,signature:{properties:[{key:"title",value:{name:"string",required:!0}},{key:"actions",value:{name:"Array",elements:[{name:"signature",type:"object",raw:`{
  key: string
  label: string
  disabled?: boolean
  loading?: boolean
  onClick?: () => void
}`,signature:{properties:[{key:"key",value:{name:"string",required:!0}},{key:"label",value:{name:"string",required:!0}},{key:"disabled",value:{name:"boolean",required:!1}},{key:"loading",value:{name:"boolean",required:!1}},{key:"onClick",value:{name:"signature",type:"function",raw:"() => void",signature:{arguments:[],return:{name:"void"}},required:!1}}]}}],raw:`Array<{
  key: string
  label: string
  disabled?: boolean
  loading?: boolean
  onClick?: () => void
}>`,required:!0}},{key:"activeFile",value:{name:"string",required:!1}},{key:"files",value:{name:"Array",elements:[{name:"signature",type:"object",raw:`{
  key: string
  label: string
  disabled?: boolean
  onClick?: () => void
}`,signature:{properties:[{key:"key",value:{name:"string",required:!0}},{key:"label",value:{name:"string",required:!0}},{key:"disabled",value:{name:"boolean",required:!1}},{key:"onClick",value:{name:"signature",type:"function",raw:"() => void",signature:{arguments:[],return:{name:"void"}},required:!1}}]}}],raw:`Array<{
  key: string
  label: string
  disabled?: boolean
  onClick?: () => void
}>`,required:!0}},{key:"helperText",value:{name:"string",required:!1}}]}},description:""}}};export{j as B};
