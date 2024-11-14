// This is our ensure authenticated middleware.
// Makes sure protected routes are accessed upon authentication
export default function ensureAuthenticated(req, res, next) {
  if (req.isAuthenticated()) {
    return next(); // Proceed if the user is authenticated
  }
  res.redirect("/login"); // Redirect to login if the user is not authenticated
}
