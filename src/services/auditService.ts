import { AuditsRepo } from '../repositories/firestoreRepo';
import { AuditLog, UserRole } from '../models/insurance';

export const auditService = {
  async log(
    action: string,
    entityType: 'QUOTE' | 'POLICY' | 'CLAIM' | 'PAYMENT' | 'USER' | 'UNIVERSITY',
    entityId: string,
    performedBy: { id: string; name: string; role: UserRole },
    details: string
  ): Promise<AuditLog> {
    const logItem: AuditLog = {
      id: 'aud_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
      action,
      entityType,
      entityId,
      performedByUserId: performedBy.id,
      performedByUserName: performedBy.name,
      performedByUserRole: performedBy.role,
      details,
      timestamp: new Date().toISOString()
    };
    return AuditsRepo.create(logItem);
  },

  async getRecentLogs(limitCount = 20): Promise<AuditLog[]> {
    const all = await AuditsRepo.getAll();
    return all
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, limitCount);
  }
};
