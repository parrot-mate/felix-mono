import ReactWavify from "react-wavify"

export const Wave = ({ moving }: { moving: boolean }) => {
  return (
    <div className="absolute top-0 left-0 w-full h-full">
      <ReactWavify
        className="absolute top-0 left-0"
        stroke="transparent"
        paused={!moving}
        style={{ display: "flex" }}
        fill="rgba(164, 203, 234, 0.1)"
        options={{
          height: 0,
          amplitude: 50,
          speed: 0.5,
          points: 3,
        }}
      />
      <ReactWavify
        className="absolute top-0 left-0"
        stroke="transparent"
        paused={!moving}
        style={{ display: "flex" }}
        fill="rgba(103, 101, 203, 0.2)"
        options={{
          height: 0,
          amplitude: 30,
          speed: 0.7,
          points: 4,
        }}
      />
    </div>
  )
}
