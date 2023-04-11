export const dateHelper = {
  getUTCTimestamp,
  getUTCTimestampFrom,
  utcToZonedTime,
  getMinutesAndSecondsDifferenceFromTime
}
const convertMinuteOffsetToTime = 60 * 1000
function getUTCTimestamp(): Date {
  return new Date(new Date(Date.now()).getTime() + new Date().getTimezoneOffset() * convertMinuteOffsetToTime)
}

function getMinutesAndSecondsDifferenceFromTime(date: Date): { minutes: number; seconds: number } {
  const currentTime = getUTCTimestamp()
  const timeDifference = currentTime.getTime() - date.getTime()
  const minutes = Math.floor(timeDifference / 1000 / 60)
  const seconds = Math.floor((timeDifference / 1000) % 60)
  return { minutes, seconds }
}

function getUTCTimestampFrom(datevalue: Date | string | number): Date {
  const date = new Date(datevalue)
  return new Date(date.getTime() + date.getTimezoneOffset() * convertMinuteOffsetToTime)
}

function utcToZonedTime(dirtyDate: Date, offsetMinutes: number) {
  const d = new Date(dirtyDate.getTime() + offsetMinutes * convertMinuteOffsetToTime)
  const resultDate = new Date(0)

  resultDate.setFullYear(d.getFullYear(), d.getMonth(), d.getDate())
  resultDate.setHours(d.getHours(), d.getMinutes(), d.getSeconds(), d.getMilliseconds())

  return resultDate
}
