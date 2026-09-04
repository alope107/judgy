/* eslint-disable */

export type SmokeTestWhereUniqueInput = {
  readonly id?: string | null
}

export type SmokeTestWhereInput = {
  readonly AND?: ReadonlyArray<SmokeTestWhereInput> | SmokeTestWhereInput | null
  readonly OR?: ReadonlyArray<SmokeTestWhereInput> | SmokeTestWhereInput | null
  readonly NOT?: ReadonlyArray<SmokeTestWhereInput> | SmokeTestWhereInput | null
  readonly id?: IDFilter | null
  readonly label?: StringFilter | null
  readonly note?: StringFilter | null
  readonly createdAt?: DateTimeNullableFilter | null
}

export type IDFilter = {
  readonly equals?: string | null
  readonly in?: ReadonlyArray<string> | string | null
  readonly notIn?: ReadonlyArray<string> | string | null
  readonly lt?: string | null
  readonly lte?: string | null
  readonly gt?: string | null
  readonly gte?: string | null
  readonly not?: IDFilter | null
}

export type StringFilter = {
  readonly equals?: string | null
  readonly in?: ReadonlyArray<string> | string | null
  readonly notIn?: ReadonlyArray<string> | string | null
  readonly lt?: string | null
  readonly lte?: string | null
  readonly gt?: string | null
  readonly gte?: string | null
  readonly contains?: string | null
  readonly startsWith?: string | null
  readonly endsWith?: string | null
  readonly mode?: QueryMode | null
  readonly not?: NestedStringFilter | null
}

export type QueryMode =
  | 'default'
  | 'insensitive'

export type NestedStringFilter = {
  readonly equals?: string | null
  readonly in?: ReadonlyArray<string> | string | null
  readonly notIn?: ReadonlyArray<string> | string | null
  readonly lt?: string | null
  readonly lte?: string | null
  readonly gt?: string | null
  readonly gte?: string | null
  readonly contains?: string | null
  readonly startsWith?: string | null
  readonly endsWith?: string | null
  readonly not?: NestedStringFilter | null
}

export type DateTimeNullableFilter = {
  readonly equals?: any | null
  readonly in?: ReadonlyArray<any> | any | null
  readonly notIn?: ReadonlyArray<any> | any | null
  readonly lt?: any | null
  readonly lte?: any | null
  readonly gt?: any | null
  readonly gte?: any | null
  readonly not?: DateTimeNullableFilter | null
}

export type SmokeTestOrderByInput = {
  readonly id?: OrderDirection | null
  readonly label?: OrderDirection | null
  readonly note?: OrderDirection | null
  readonly createdAt?: OrderDirection | null
}

export type OrderDirection =
  | 'asc'
  | 'desc'

export type SmokeTestUpdateInput = {
  readonly label?: string | null
  readonly note?: string | null
  readonly createdAt?: any | null
}

export type SmokeTestUpdateArgs = {
  readonly where: SmokeTestWhereUniqueInput
  readonly data: SmokeTestUpdateInput
}

export type SmokeTestCreateInput = {
  readonly label?: string | null
  readonly note?: string | null
  readonly createdAt?: any | null
}

export type KeystoneAdminUIFieldMetaIsNonNull =
  | 'read'
  | 'create'
  | 'update'

export type KeystoneAdminUIFieldMetaItemViewFieldPosition =
  | 'form'
  | 'sidebar'

export type KeystoneAdminUIFieldMetaListViewFieldMode =
  | 'read'
  | 'hidden'

export type KeystoneAdminUIActionMetaItemViewNavigation =
  | 'follow'
  | 'refetch'
  | 'return'

export type KeystoneAdminUISortDirection =
  | 'ASC'
  | 'DESC'

type ResolvedSmokeTestCreateInput = {
  id?: import('../../generated/prisma/client.js').Prisma.SmokeTestCreateInput['id']
  label?: import('../../generated/prisma/client.js').Prisma.SmokeTestCreateInput['label']
  note?: import('../../generated/prisma/client.js').Prisma.SmokeTestCreateInput['note']
  createdAt?: import('../../generated/prisma/client.js').Prisma.SmokeTestCreateInput['createdAt']
}
type ResolvedSmokeTestUpdateInput = {
  id?: undefined
  label?: import('../../generated/prisma/client.js').Prisma.SmokeTestUpdateInput['label']
  note?: import('../../generated/prisma/client.js').Prisma.SmokeTestUpdateInput['note']
  createdAt?: import('../../generated/prisma/client.js').Prisma.SmokeTestUpdateInput['createdAt']
}

export interface Session {}
type __Session = keyof Session extends never ? any : Session

export declare namespace Lists {
  export type SmokeTest<Session = __Session> = import('@keystone-6/core/types').ListConfig<Lists.SmokeTest.TypeInfo<Session>>
  namespace SmokeTest {
    export type Item = import('../../generated/prisma/client.js').SmokeTest
    export type TypeInfo<Session = __Session> = {
      key: 'SmokeTest'
      isSingleton: false
      fields: 'id' | 'label' | 'note' | 'createdAt'
      actions: never
      item: Item
      inputs: {
        where: SmokeTestWhereInput
        uniqueWhere: SmokeTestWhereUniqueInput
        create: SmokeTestCreateInput
        update: SmokeTestUpdateInput
        orderBy: SmokeTestOrderByInput
      }
      prisma: {
        create: ResolvedSmokeTestCreateInput
        update: ResolvedSmokeTestUpdateInput
      }
      all: __TypeInfo<Session>
    }
  }
}
export type Context<Session = __Session> = import('@keystone-6/core/types').KeystoneContext<TypeInfo<Session>>
export type Config<Session = __Session> = import('@keystone-6/core/types').KeystoneConfig<TypeInfo<Session>>

export type TypeInfo<Session = __Session> = {
  lists: {
    readonly SmokeTest: Lists.SmokeTest.TypeInfo<Session>
  }
  prisma: import('../../generated/prisma/client.js').PrismaClient
  prismaClientOptions: import('../../generated/prisma/client.js').Prisma.PrismaClientOptions
  session: Session
  dbProvider: 'postgresql'
}

type __TypeInfo<Session = __Session> = TypeInfo<Session>

export type Lists<Session = __Session> = {
  [Key in keyof TypeInfo['lists']]?: import('@keystone-6/core/types').ListConfig<TypeInfo<Session>['lists'][Key]>
} & Record<string, import('@keystone-6/core/types').ListConfig<any>>

export {}
