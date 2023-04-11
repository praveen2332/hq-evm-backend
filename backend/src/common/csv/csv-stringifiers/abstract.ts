import { FieldStringifier } from '../field-stringifier'
import { Field } from '../record'

const DEFAULT_RECORD_DELIMITER = '\n'
const VALID_RECORD_DELIMITERS = [DEFAULT_RECORD_DELIMITER, '\r\n']

export abstract class CsvStringifier<T> {
  constructor(
    private readonly fieldStringifier: FieldStringifier,
    private readonly recordDelimiter = DEFAULT_RECORD_DELIMITER
  ) {
    _validateRecordDelimiter(recordDelimiter)
  }

  getHeaderString(): string | null {
    const headerRecord = this.getHeaderRecord()
    return headerRecord ? this.joinRecords([this.getCsvLine(headerRecord)]) : null
  }

  stringifyRecords(records: IterableIterator<T> | T[]): string {
    const csvLines = Array.from(records, (record) => this.getCsvLine(this.getRecordAsArray(record)))
    return this.joinRecords(csvLines)
  }

  getCsvString(records: IterableIterator<T> | T[]): string {
    const headerLine = this.getHeaderString()
    const csvLines = Array.from(records, (record) => this.getCsvLine(this.getRecordAsArray(record)))
    return this.joinRecords([headerLine, ...csvLines])
  }

  getCsvByPages(records: IterableIterator<T> | T[], pageSize = 1000): string[] {
    const pages: string[] = []
    const data = Array.from(records)
    for (let i = 0; i < data.length; i += pageSize) {
      const chunk = data.slice(i, i + pageSize)
      pages.push(this.getCsvString(chunk))
    }
    return pages
  }

  protected abstract getRecordAsArray(_record: T): Field[]

  protected abstract getHeaderRecord(): string[] | null | undefined

  private getCsvLine(record: Field[]): string {
    return record
      .map((fieldValue) => this.fieldStringifier.stringify(fieldValue))
      .join(this.fieldStringifier.fieldDelimiter)
  }

  private joinRecords(records: string[]) {
    return records.join(this.recordDelimiter)
  }
}

function _validateRecordDelimiter(delimiter: string): void {
  if (VALID_RECORD_DELIMITERS.indexOf(delimiter) === -1) {
    throw new Error(`Invalid record delimiter \`${delimiter}\` is specified`)
  }
}
