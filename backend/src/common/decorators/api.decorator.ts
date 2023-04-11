import { applyDecorators, Type } from '@nestjs/common'
import { ApiBody, ApiConsumes, ApiExtraModels, ApiOkResponse, getSchemaPath } from '@nestjs/swagger'
import { PaginationResponse } from '../../core/interfaces'

export const ApiOkResponsePaginated = <DataDto extends Type<unknown>>(dataDto: DataDto) =>
  applyDecorators(
    ApiExtraModels(PaginationResponse, dataDto),
    ApiOkResponse({
      schema: {
        allOf: [
          { $ref: getSchemaPath(PaginationResponse) },
          {
            properties: {
              items: {
                type: 'array',
                items: { $ref: getSchemaPath(dataDto) }
              }
            }
          }
        ]
      }
    })
  )

export const ApiMultiFile = (fileName: string): MethodDecorator =>
  applyDecorators(
    ApiConsumes('multipart/form-data'),
    ApiBody({
      type: 'file',
      required: true,
      schema: {
        type: 'object',
        properties: {
          [fileName]: {
            type: 'array',
            items: {
              type: 'string',
              format: 'binary'
            }
          }
        }
      }
    })
  )
