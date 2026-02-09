const bcrypt = require('bcryptjs');
const { query, queryOne } = require('../config/database');
const { generateToken } = require('../middleware/auth');
const { createOTP, verifyOTP } = require('../services/otpService');
const { sendOTPEmail, sendWelcomeEmail } = require('../services/emailService');
const config = require('../config');
const { OAuth2Client } = require('google-auth-library');
const client = new OAuth2Client(config.google.clientId);

// Signup with email/password
const signup = async (req, res) => {
    try {
        const { email, password, fullName, username, mobileNumber } = req.body;

        // Check if user already exists
        const existingUser = await queryOne(
            'SELECT * FROM users WHERE Email = ? OR (Username = ? AND Username IS NOT NULL)',
            [email, username || null]
        );

        if (existingUser) {
            if (existingUser.Email === email) {
                return res.status(400).json({
                    success: false,
                    message: 'Email already registered. Please login or use a different email.'
                });
            }
            if (existingUser.Username === username) {
                return res.status(400).json({
                    success: false,
                    message: 'Username already taken. Please choose a different username.'
                });
            }
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 12);

        // Get default role (Staff)
        const defaultRole = await queryOne(
            "SELECT RoleId FROM roles WHERE RoleCode = 'STAFF' AND IsActive = TRUE"
        );

        // Create user
        const result = await query(
            `INSERT INTO users (FullName, Email, Username, MobileNumber, Password, RoleId, Status, CreatedDate) 
             VALUES (?, ?, ?, ?, ?, ?, 'Inactive', NOW())`,
            [fullName, email, username || null, mobileNumber || null, hashedPassword, defaultRole?.RoleId || null]
        );

        // Generate and send OTP
        const otp = await createOTP(email, 'email_verification');
        await sendOTPEmail(email, otp, 'email_verification');

        res.status(201).json({
            success: true,
            message: 'Registration successful. Please check your email for OTP verification.',
            data: {
                userId: result.insertId,
                email
            }
        });
    } catch (error) {
        console.error('Signup error:', error);
        res.status(500).json({
            success: false,
            message: 'Registration failed. Please try again.'
        });
    }
};

// Verify OTP for email verification
const verifyEmailOTP = async (req, res) => {
    try {
        const { email, otp } = req.body;

        // Verify OTP
        const result = await verifyOTP(email, otp, 'email_verification');

        if (!result.valid) {
            return res.status(400).json({
                success: false,
                message: result.message
            });
        }

        // Update user status and email verification
        const updateResult = await query(
            "UPDATE users SET IsEmailVerified = TRUE, Status = 'Active' WHERE Email = ?",
            [email]
        );

        if (updateResult.affectedRows === 0) {
            return res.status(404).json({
                success: false,
                message: 'User not found.'
            });
        }

        // Get updated user
        const user = await queryOne(
            `SELECT u.*, r.RoleName, r.RoleCode 
             FROM users u 
             LEFT JOIN roles r ON u.RoleId = r.RoleId 
             WHERE u.Email = ?`,
            [email]
        );

        // Generate token
        const token = generateToken(user);

        // Send welcome email
        await sendWelcomeEmail(email, user.FullName);

        res.json({
            success: true,
            message: 'Email verified successfully.',
            data: {
                token,
                user: {
                    userId: user.UserId,
                    email: user.Email,
                    fullName: user.FullName,
                    role: user.RoleName
                }
            }
        });
    } catch (error) {
        console.error('OTP verification error:', error);
        res.status(500).json({
            success: false,
            message: 'Verification failed. Please try again.'
        });
    }
};

// Resend OTP
const resendOTP = async (req, res) => {
    try {
        const { email } = req.body;

        // Check if user exists
        const user = await queryOne(
            'SELECT * FROM users WHERE Email = ?',
            [email]
        );

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found.'
            });
        }

        if (user.IsEmailVerified) {
            return res.status(400).json({
                success: false,
                message: 'Email already verified.'
            });
        }

        // Generate and send new OTP
        const otp = await createOTP(email, 'email_verification');
        await sendOTPEmail(email, otp, 'email_verification');

        res.json({
            success: true,
            message: 'OTP sent successfully. Please check your email.'
        });
    } catch (error) {
        console.error('Resend OTP error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to resend OTP. Please try again.'
        });
    }
};

// Login with email/password
const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        // Get user with role
        const user = await queryOne(
            `SELECT u.*, r.RoleName, r.RoleCode 
             FROM users u 
             LEFT JOIN roles r ON u.RoleId = r.RoleId 
             WHERE u.Email = ?`,
            [email]
        );

        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'Invalid email or password.'
            });
        }

        // Check if user has password (not Google-only account)
        if (!user.Password) {
            return res.status(401).json({
                success: false,
                message: 'This account uses Google login. Please login with Google.'
            });
        }

        // Verify password
        const isPasswordValid = await bcrypt.compare(password, user.Password);

        if (!isPasswordValid) {
            return res.status(401).json({
                success: false,
                message: 'Invalid email or password.'
            });
        }

        // Check user status
        if (user.Status === 'Blocked') {
            return res.status(403).json({
                success: false,
                message: 'Your account has been blocked. Please contact support.'
            });
        }

        // Check email verification
        if (!user.IsEmailVerified) {
            // Resend OTP
            const otp = await createOTP(email, 'email_verification');
            await sendOTPEmail(email, otp, 'email_verification');

            return res.status(403).json({
                success: false,
                message: 'Email not verified. A new OTP has been sent to your email.',
                requiresVerification: true
            });
        }

        // Update last login
        await query(
            'UPDATE users SET LastLogin = NOW() WHERE UserId = ?',
            [user.UserId]
        );

        // Generate token
        const token = generateToken(user);

        res.json({
            success: true,
            message: 'Login successful.',
            data: {
                token,
                user: {
                    userId: user.UserId,
                    email: user.Email,
                    fullName: user.FullName,
                    username: user.Username,
                    role: user.RoleName,
                    roleCode: user.RoleCode,
                    organizationId: user.OrganizationId
                }
            }
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({
            success: false,
            message: 'Login failed. Please try again.'
        });
    }
};

// Google Login with ID Token (for Mobile/Client-side flow)
const googleLogin = async (req, res) => {
    try {
        const { token } = req.body;

        if (!token) {
            return res.status(400).json({
                success: false,
                message: 'Token is required.'
            });
        }

        // Verify Google Token
        const ticket = await client.verifyIdToken({
            idToken: token,
            audience: [
                config.google.clientId,
                process.env.GOOGLE_ANDROID_CLIENT_ID,
                process.env.GOOGLE_IOS_CLIENT_ID,
                process.env.GOOGLE_WEB_CLIENT_ID
            ]
        });
        const payload = ticket.getPayload();
        const { email, name, sub: googleId, picture } = payload;

        // Check if user exists
        let user = await queryOne(
            'SELECT * FROM users WHERE GoogleId = ?',
            [googleId]
        );

        if (!user) {
            // Check by email
            user = await queryOne(
                'SELECT * FROM users WHERE Email = ?',
                [email]
            );

            if (user) {
                // Link Google account
                await query(
                    'UPDATE users SET GoogleId = ?, IsEmailVerified = TRUE, Status = ? WHERE UserId = ?',
                    [googleId, 'Active', user.UserId]
                );
                user.GoogleId = googleId;
                user.IsEmailVerified = true;
            } else {
                // Create new user
                const defaultRole = await queryOne(
                    "SELECT RoleId FROM roles WHERE RoleCode = 'STAFF' AND IsActive = TRUE"
                );

                const result = await query(
                    `INSERT INTO users (FullName, Email, GoogleId, RoleId, Status, IsEmailVerified, CreatedDate) 
                     VALUES (?, ?, ?, ?, 'Active', TRUE, NOW())`,
                    [name, email, googleId, defaultRole?.RoleId || null]
                );

                user = await queryOne(
                    'SELECT * FROM users WHERE UserId = ?',
                    [result.insertId]
                );
            }
        }

        // Check if blocked
        if (user.Status === 'Blocked') {
            return res.status(403).json({
                success: false,
                message: 'Your account has been blocked.'
            });
        }

        // Update last login
        await query(
            'UPDATE users SET LastLogin = NOW() WHERE UserId = ?',
            [user.UserId]
        );

        // Get full user details with role
        const fullUser = await queryOne(
            `SELECT u.*, r.RoleName, r.RoleCode 
             FROM users u 
             LEFT JOIN roles r ON u.RoleId = r.RoleId 
             WHERE u.UserId = ?`,
            [user.UserId]
        );

        // Generate token
        const jwtToken = generateToken(fullUser);

        res.json({
            success: true,
            message: 'Google login successful.',
            data: {
                token: jwtToken,
                user: {
                    userId: fullUser.UserId,
                    email: fullUser.Email,
                    fullName: fullUser.FullName,
                    username: fullUser.Username,
                    role: fullUser.RoleName,
                    roleCode: fullUser.RoleCode,
                    organizationId: fullUser.OrganizationId,
                    picture: picture
                }
            }
        });

    } catch (error) {
        console.error('Google login error:', error);
        res.status(401).json({
            success: false,
            message: 'Invalid Google token.'
        });
    }
};

// Google OAuth callback handler
const googleCallback = async (req, res) => {
    try {
        const user = req.user;

        if (!user) {
            return res.redirect(`${config.frontendUrl}/login?error=google_auth_failed`);
        }

        // Get user with role info
        const fullUser = await queryOne(
            `SELECT u.*, r.RoleName, r.RoleCode 
             FROM users u 
             LEFT JOIN roles r ON u.RoleId = r.RoleId 
             WHERE u.UserId = ?`,
            [user.UserId]
        );

        // Generate token
        const token = generateToken(fullUser);

        // Redirect to frontend with token
        res.redirect(`${config.frontendUrl}/auth/callback?token=${token}`);
    } catch (error) {
        console.error('Google callback error:', error);
        res.redirect(`${config.frontendUrl}/login?error=google_auth_failed`);
    }
};

// Get current user profile
const getProfile = async (req, res) => {
    try {
        const user = await queryOne(
            `SELECT u.UserId, u.FullName, u.Email, u.Username, u.MobileNumber, 
                    u.Status, u.IsEmailVerified, u.LastLogin, u.CreatedDate,
                    r.RoleName, r.RoleCode,
                    o.OrganizationName, o.OrganizationType
             FROM users u 
             LEFT JOIN roles r ON u.RoleId = r.RoleId 
             LEFT JOIN organizations o ON u.OrganizationId = o.OrganizationId
             WHERE u.UserId = ?`,
            [req.user.UserId]
        );

        res.json({
            success: true,
            data: user
        });
    } catch (error) {
        console.error('Get profile error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch profile.'
        });
    }
};

// Forgot password - send OTP
const forgotPassword = async (req, res) => {
    try {
        const { email } = req.body;

        const user = await queryOne(
            'SELECT * FROM users WHERE Email = ?',
            [email]
        );

        if (!user) {
            // Don't reveal if user exists
            return res.json({
                success: true,
                message: 'If an account exists with this email, an OTP will be sent.'
            });
        }

        const otp = await createOTP(email, 'password_reset');
        await sendOTPEmail(email, otp, 'password_reset');

        res.json({
            success: true,
            message: 'If an account exists with this email, an OTP will be sent.'
        });
    } catch (error) {
        console.error('Forgot password error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to process request. Please try again.'
        });
    }
};

// Reset password with OTP
const resetPassword = async (req, res) => {
    try {
        const { email, otp, newPassword } = req.body;

        // Verify OTP
        const result = await verifyOTP(email, otp, 'password_reset');

        if (!result.valid) {
            return res.status(400).json({
                success: false,
                message: result.message
            });
        }

        // Hash new password
        const hashedPassword = await bcrypt.hash(newPassword, 12);

        // Update password
        await query(
            'UPDATE users SET Password = ? WHERE Email = ?',
            [hashedPassword, email]
        );

        res.json({
            success: true,
            message: 'Password reset successful. Please login with your new password.'
        });
    } catch (error) {
        console.error('Reset password error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to reset password. Please try again.'
        });
    }
};

module.exports = {
    signup,
    verifyEmailOTP,
    resendOTP,
    login,
    googleLogin,
    googleCallback,
    getProfile,
    forgotPassword,
    resetPassword
};
