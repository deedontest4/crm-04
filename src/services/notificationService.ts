import { supabase } from '@/integrations/supabase/client';

interface NotificationData {
  user_id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'approval' | 'rejection' | 'assignment' | 'update';
  performed_by?: string;
}

/**
 * Service to create notifications for various actions
 */
export const notificationService = {
  /**
   * Create a notification
   */
  async create(data: NotificationData) {
    try {
      const { error } = await supabase
        .from('notifications')
        .insert({
          user_id: data.user_id,
          title: data.title,
          message: data.message,
          type: data.type,
          performed_by: data.performed_by || null,
          read: false,
        });

      if (error) throw error;
    } catch (error) {
      console.error('Error creating notification:', error);
    }
  },

  /**
   * Notify user when their rating is approved
   */
  async notifyRatingApproved(userId: string, approverName: string, skillName: string, approverId: string) {
    await this.create({
      user_id: userId,
      title: 'Rating Approved',
      message: `${approverName} approved your ${skillName} rating`,
      type: 'approval',
      performed_by: approverId,
    });
  },

  /**
   * Notify user when their rating is rejected
   */
  async notifyRatingRejected(userId: string, approverName: string, skillName: string, reason: string, approverId: string) {
    await this.create({
      user_id: userId,
      title: 'Rating Rejected',
      message: `${approverName} rejected your ${skillName} rating. Reason: ${reason}`,
      type: 'rejection',
      performed_by: approverId,
    });
  },

  /**
   * Notify user when assigned to a project
   */
  async notifyProjectAssignment(userId: string, assignerName: string, projectName: string, assignerId: string) {
    await this.create({
      user_id: userId,
      title: 'Project Assignment',
      message: `${assignerName} assigned you to project "${projectName}"`,
      type: 'assignment',
      performed_by: assignerId,
    });
  },

  /**
   * Notify user when removed from a project
   */
  async notifyProjectRemoval(userId: string, removerName: string, projectName: string, removerId: string) {
    await this.create({
      user_id: userId,
      title: 'Project Removal',
      message: `${removerName} removed you from project "${projectName}"`,
      type: 'update',
      performed_by: removerId,
    });
  },

  /**
   * Notify tech lead of pending rating approval
   */
  async notifyPendingApproval(techLeadId: string, employeeName: string, skillName: string, employeeId: string) {
    await this.create({
      user_id: techLeadId,
      title: 'Pending Approval',
      message: `${employeeName} submitted a ${skillName} rating for your review`,
      type: 'info',
      performed_by: employeeId,
    });
  },

  /**
   * Notify user of profile updates
   */
  async notifyProfileUpdate(userId: string, updaterName: string, changes: string, updaterId: string) {
    await this.create({
      user_id: userId,
      title: 'Profile Updated',
      message: `${updaterName} updated your profile: ${changes}`,
      type: 'update',
      performed_by: updaterId,
    });
  },

  /**
   * Notify user of goal achievement
   */
  async notifyGoalAchievement(userId: string, goalTitle: string) {
    await this.create({
      user_id: userId,
      title: 'Goal Achieved! 🎉',
      message: `Congratulations! You've achieved your goal: ${goalTitle}`,
      type: 'success',
      performed_by: userId,
    });
  },
};
