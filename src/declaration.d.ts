/**
 * Fixes import warning when loading .scss files; ref: https://github.com/zeit/next-plugins/issues/91
 */
declare module '*.scss' {
  export const content: { [className: string]: string }
  export default content
}
