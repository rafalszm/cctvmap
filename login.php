<?php
session_start();
require_once 'auth.php';

if (isset($_SESSION['user'])) {
    header('Location: index.php');
    exit;
}

$error = '';
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $u = $_POST['username'] ?? '';
    $p = $_POST['password'] ?? '';
    if (isset($USERS[$u]) && $USERS[$u] === $p) {
        $_SESSION['user'] = $u;
        header('Location: index.php');
        exit;
    }
    $error = 'Invalid credentials';
}
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Login</title>
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css">
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.5.2/css/all.min.css">
</head>
<body class="container py-5 position-relative">
<button id="theme-toggle" class="btn btn-outline-secondary position-absolute top-0 end-0 mt-3 me-3"><i id="theme-icon" class="fa-solid fa-moon"></i></button>
<h1 class="mb-4">CCTV Login</h1>
<?php if ($error): ?>
<div class="alert alert-danger"><?= htmlspecialchars($error) ?></div>
<?php endif; ?>
<form method="post" class="w-25">
  <div class="mb-3">
    <label class="form-label">Username</label>
    <input type="text" name="username" class="form-control" required>
  </div>
  <div class="mb-3">
    <label class="form-label">Password</label>
    <input type="password" name="password" class="form-control" required>
  </div>
  <button type="submit" class="btn btn-primary">Login</button>
</form>
<script>
function getCookie(name){const m=document.cookie.match('(^|;)\\s*'+name+'=([^;]+)');return m?m.pop():'';}
function setTheme(t){document.documentElement.setAttribute('data-bs-theme',t);document.cookie='theme='+t+';path=/';}
document.addEventListener('DOMContentLoaded',()=>{
  const saved=getCookie('theme')||'light';
  setTheme(saved);
  const icon=document.getElementById('theme-icon');
  icon.classList.toggle('fa-sun',saved==='dark');
  icon.classList.toggle('fa-moon',saved!=='dark');
  document.getElementById('theme-toggle').addEventListener('click',()=>{
    const cur=document.documentElement.getAttribute('data-bs-theme');
    const next=cur==='dark'?'light':'dark';
    setTheme(next);
    icon.classList.toggle('fa-sun');
    icon.classList.toggle('fa-moon');
  });
});
</script>
</body>
</html>
