import { Button } from "./components/Button"

const App = () => {
  return (
    <div className="min-h-screen bg-slate-50 px-6 py-10 text-slate-900">
      <div className="mx-auto flex max-w-xl flex-col gap-4 rounded-2xl bg-white p-6 shadow-sm">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-slate-400">PMate</p>
          <h1 className="text-2xl font-semibold text-slate-900">UIKit Preview</h1>
        </div>
        <p className="text-sm text-slate-600">
          Quick sanity check for the component library build.
        </p>
        <div>
          <Button type="button">Primary Button</Button>
        </div>
      </div>
    </div>
  )
}

export default App
