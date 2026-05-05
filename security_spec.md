# Security Specification - Faculty Evaluation System

## Data Invariants
1. A Student can only submit a SET evaluation for a section they are enrolled in (simulated by allowing if the section exists).
2. A Student can only submit ONE evaluation per section per academic period.
3. A Supervisor can only submit a SAF evaluation for a faculty member.
4. Evaluation scores must be integers between 1 and 5.
5. There must be exactly 15 scores in each evaluation.
6. User roles are immutable once set except by an Admin.
7. Only Admins can create sections and academic periods.

## The "Dirty Dozen" Payloads
1. **Unauthorized Write**: Attempting to write to `users` as a different UID.
2. **Role Escalation**: Student trying to change their role to ADMIN.
3. **Invalid Scores**: Submitting an evaluation with scores outside 1-5.
4. **Incorrect Score Count**: Submitting an evaluation with 14 or 16 scores instead of 15.
5. **Cross-User Data Leak**: Student trying to read other students' evaluations.
6. **Supervisor Spoofing**: A non-supervisor trying to submit a SAF form.
7. **Bypassing Evaluation Limits**: Submitting multiple SET forms for the same section.
8. **Document ID Poisoning**: Using a 1MB string as a section ID.
9. **Admin State override**: Supervisor trying to delete an Academic Period.
10. **Data Injection**: Adding extra fields to an evaluation form to store malicious scripts.
11. **Email Spoofing**: Trying to set an email that doesn't match the auth token.
12. **System Field Tampering**: Trying to set a `createdAt` timestamp from the client instead of `serverTimestamp()`.

## Test Runner logic
- Block write if `request.auth.uid != userId`.
- Block update if `incoming().role != existing().role` unless requester is Admin.
- Validate evaluation scores array size and values.
- Enforce `isValidId()` on all path parameters.
- Restrict list queries to relevant data (e.g., faculty can only see their own reports).
