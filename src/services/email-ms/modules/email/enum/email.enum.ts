export enum EmailTemplate {
  WELCOME = 'welcome',
  INVITATION = 'invitation',
  PASSWORD_RECOVERY = 'password-recovery-{company}-{language}',
  CONFIRM_ACCOUNT = 'email-confirmation-{company}-{language}',
  ACCOUNT_VERIFICATION = 'account_verification',
  NEWSLETTER = 'newsletter',
  ACCOUNT_DELETION_CONFIRMATION = 'account_deletion_confirmation',
  TWO_FACTOR_AUTHENTICATION = 'two_factor_authentication',
  ORGANIZATION_INVITATION = 'organization_invitation',
  MEMBERSHIP_REQUEST = 'membership_request',
  MEMBERSHIP_APPROVAL = 'membership_approval',
}
