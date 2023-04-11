export const csvUtils = {
  getHyperlink,
  getDate
}

function getHyperlink(url: string, text: string) {
  return `=HYPERLINK("${url}","${text}")`
}
function getDate(date: string) {
  return `=TO_DATE("${date}")`
}
