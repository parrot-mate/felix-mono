import { Button, InputField, Link } from "@pmate/uikit"

export const TestUIKit = () => {
  return (
    <>
      <div>
        <Button
          variant="primary"
          onClick={() => {
            console.log("Button clicked!")
          }}
        >
          Click Me!
        </Button>
      </div>
      <div className="mt-4">
        <InputField placeholder="Type something..." type="text" />
      </div>
      <div className="mt-4">
        <Link href="#">This is a link</Link>
      </div>
    </>
  )
}
