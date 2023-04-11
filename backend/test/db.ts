import { newDb, DataType } from 'pg-mem'
import { v4 } from 'uuid'

export async function getConnection(entities) {
  const db = newDb({
    autoCreateForeignKeyIndices: true
  })

  db.registerExtension('uuid-ossp', (schema) => {
    schema.registerFunction({
      name: 'uuid_generate_v4',
      returns: DataType.uuid,
      implementation: v4,
      impure: true
    })
  })

  db.public.registerFunction({
    implementation: () => 'test',
    name: 'current_database'
  })

  db.public.registerFunction({
    implementation: () => v4(),
    name: 'uuid_generate_v4'
  })

  const connection = await db.adapters.createTypeormConnection({
    type: 'postgres',
    entities
  })

  await connection.synchronize()

  return connection
}
