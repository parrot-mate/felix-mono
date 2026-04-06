export const formatTime = (timeInSecond: number): [number, string] => {
  if (timeInSecond < 60) {
    return [timeInSecond, "秒"]
  } else if (timeInSecond < 3600) {
    return [Math.floor(timeInSecond / 60), "min"]
  } else {
    return [Math.floor((timeInSecond * 10) / 3600) / 10, "H"]
  }
}
