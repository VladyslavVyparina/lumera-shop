(function () {
  document.querySelectorAll('.lumera-home .lum-acb').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var body = btn.nextElementSibling;
      var open = btn.classList.contains('open');
      document.querySelectorAll('.lumera-home .lum-acb.open').forEach(function (b) {
        b.classList.remove('open');
        if (b.nextElementSibling) b.nextElementSibling.classList.remove('open');
      });
      if (!open) {
        btn.classList.add('open');
        if (body) body.classList.add('open');
      }
    });
  });
})();
