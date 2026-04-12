import{j as n}from"./iframe-aH6RCRiI.js";import{B as t}from"./BlueprintButton-songOEbk.js";import{B as o}from"./BlueprintPanel-CVAXEfCq.js";function d({title:r,actions:i,activeFile:l,files:s,helperText:a}){return n.jsxs(o,{title:r,children:[n.jsx("div",{className:"bp-actions",children:i.map(e=>n.jsx(t,{disabled:e.disabled,onClick:e.onClick,ariaLabel:e.label,children:e.loading?`${e.label} 中...`:e.label},e.key))}),n.jsx("div",{style:{height:16}}),n.jsx("div",{className:"bp-doc-tabs",children:s.map(e=>n.jsx("button",{type:"button",disabled:e.disabled,onClick:e.onClick,className:e.key===l?"bp-doc-tab bp-doc-tab--active":"bp-doc-tab",children:e.label},e.key))}),a?n.jsx("p",{className:"bp-panel__meta",style:{marginTop:12},children:a}):null]})}d.__docgenInfo={description:"",methods:[],displayName:"BlueprintDocActionsModule",props:{title:{required:!0,tsType:{name:"string"},description:""},actions:{required:!0,tsType:{name:"Array",elements:[{name:"signature",type:"object",raw:`{
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
}>`},description:""},activeFile:{required:!1,tsType:{name:"string"},description:""},files:{required:!0,tsType:{name:"Array",elements:[{name:"signature",type:"object",raw:`{
  key: string
  label: string
  disabled?: boolean
  onClick?: () => void
}`,signature:{properties:[{key:"key",value:{name:"string",required:!0}},{key:"label",value:{name:"string",required:!0}},{key:"disabled",value:{name:"boolean",required:!1}},{key:"onClick",value:{name:"signature",type:"function",raw:"() => void",signature:{arguments:[],return:{name:"void"}},required:!1}}]}}],raw:`Array<{
  key: string
  label: string
  disabled?: boolean
  onClick?: () => void
}>`},description:""},helperText:{required:!1,tsType:{name:"string"},description:""}}};export{d as B};
