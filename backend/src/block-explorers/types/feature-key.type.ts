export enum FeatureEnum {
  INGESTION = 'ingestion'
}

export type FeatureKey = keyof typeof FeatureEnum

//create type where key is FeatureKey and value is string
export type FeatureMapType = {
  [key in FeatureKey]: string
}
