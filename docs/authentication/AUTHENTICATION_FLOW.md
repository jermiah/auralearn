# Authentication Flow

## Overview
The application now has a proper authentication flow that distinguishes between new users and returning users.

## User Flows

### 1. New User Sign Up
1. User visits home page (`/`)
2. Clicks "Sign up here" link
3. Redirected to `/sign-up` (Clerk sign-up form)
4. After successful sign-up → Redirected to `/select-role`
5. User selects Teacher or Parent role
6. Role is saved to Clerk metadata and Supabase
7. User is redirected to their dashboard:
   - Teacher → `/create-class`
   - Parent → `/parent-guide`

### 2. Existing User Sign In
1. User visits home page (`/`)
2. Clicks "Teacher Login" or "Parent Login" button
3. Redirected to `/sign-in` (Clerk sign-in form)
4. After successful sign-in → Redirected to `/auth-callback`
5. AuthCallback checks if user has a role:
   - **Has role** → Redirected to their dashboard (Teacher: `/create-class`, Parent: `/parent-guide`)
   - **No role** → Redirected to `/select-role` (shouldn't happen for existing users)

### 3. Authenticated User Visits Home Page
1. User visits home page (`/`)
2. If authenticated and has role:
   - Shows "Go to Dashboard" button
   - Clicking it redirects to their appropriate dashboard
3. If not authenticated:
   - Shows "Teacher Login" and "Parent Login" buttons

## Key Components

### `/auth-callback`
- Smart redirect page that checks user's role
- Waits for both Clerk and Supabase to sync (500ms delay)
- Redirects to appropriate destination based on authentication state

### `/select-role`
- Only shown to users without a role
- If user already has a role, automatically redirects to dashboard
- Allows new users to choose between Teacher and Parent roles

### Home Page (`/`)
- Landing page always visible to everyone
- Shows different buttons based on authentication state
- No automatic redirects (users can always return to home)

## Technical Details

- **Clerk**: Handles authentication (sign-in/sign-up)
- **Supabase**: Stores user profiles and roles
- **AuthContext**: Syncs Clerk user with Supabase profile
- **Role Storage**: Stored in both Clerk metadata and Supabase for redundancy
