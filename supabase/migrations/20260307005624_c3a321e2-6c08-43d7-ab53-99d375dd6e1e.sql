
UPDATE auth.users 
SET email_change = '', 
    email_change_token_new = '', 
    email_change_token_current = '',
    email_change_confirm_status = 0,
    phone_change = '',
    phone_change_token = ''
WHERE email IN ('test@monetra.com', 'admin@monetra.com');
