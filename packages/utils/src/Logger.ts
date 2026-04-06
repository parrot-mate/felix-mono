export class Logger {
  private constructor(private name: string) {}

  log(...args: any[]) {
    const color = "blue"
    // Create a CSS style string for the given color
    const css = `color: ${color}; font-weight: bold;`

    // Log the message with the styles
    const header = `%c[${this.name}]`
    console.debug(header, css, ...args)
  }

  error(...args: any[]) {
    const color = "red"
    // Create a CSS style string for the given color
    const css = `color: ${color}; font-weight: bold;`

    // Log the message with the styles
    const header = `%c[${this.name}]`
    console.error(header, css, ...args)
  }

  static getDebugger(name: string) {
    return new Logger(name)
  }
}
