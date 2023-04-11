export const sortByName = (list: any[]) =>
  list.sort((a, b) => (!a.name || !b.name || a.name < b.name ? -1 : a.name > b.name ? 1 : 0))
