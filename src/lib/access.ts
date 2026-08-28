export const roleLabels: Record<string, string> = {
  admin: 'Administrador',
  gestor_enat: 'Gestor ENAT',
  instrutor: 'Instrutor',
  pesquisador: 'Pesquisador',
  empresa: 'Empresa',
  instituicao: 'Instituição',
  embaixador: 'Embaixador',
}

export const rolePermissions: Record<string, string[]> = {
  admin: ['overview','academy','hsi','observatory','research','ecosystem','billing'],
  gestor_enat: ['overview','academy','hsi','observatory','research','ecosystem','billing'],
  instrutor: ['overview','academy','hsi','ecosystem','billing'],
  pesquisador: ['overview','hsi','observatory','research'],
  empresa: ['overview','observatory','billing'],
  instituicao: ['overview','academy','observatory','research','billing'],
  embaixador: ['overview','academy','ecosystem','billing'],
}

export function canAccess(role: string | null | undefined, moduleId: string) {
  return Boolean(role && rolePermissions[role]?.includes(moduleId))
}
