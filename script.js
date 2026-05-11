const toast = document.querySelector('.toast');
const forms = document.querySelectorAll('form[data-form-name]');
const reveals = document.querySelectorAll('.reveal');

// Thay URL này bằng URL Web App sau khi deploy Apps Script.
const APPS_SCRIPT_WEB_APP_URL = 'https://script.google.com/macros/s/AKfycbzw06zfthu5zoU6ADSqHgmyzjAi8mJIbbW0djWs0gzL2q8vTSGvGaIzXZt7EDiJ1SDg/exec';

function showToast(message) {
  toast.textContent = message;
  toast.classList.add('show');
  window.clearTimeout(showToast.timer);
  showToast.timer = window.setTimeout(() => toast.classList.remove('show'), 3600);
}

forms.forEach((form) => {
  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    if (!form.checkValidity()) {
      form.reportValidity();
      return;
    }

    const formName = form.dataset.formName || 'Form đăng ký';
    if (!APPS_SCRIPT_WEB_APP_URL || APPS_SCRIPT_WEB_APP_URL.includes('PASTE_YOUR_APPS_SCRIPT_WEB_APP_URL_HERE')) {
      showToast('Chưa cấu hình URL Google Apps Script.');
      return;
    }

    const formData = new FormData(form);
    const params = new URLSearchParams();
    params.set('form_name', formName);
    params.set('submitted_at', new Date().toISOString());
    params.set('page_url', window.location.href);

    formData.forEach((value, key) => {
      params.set(key, String(value).trim());
    });

    const requestUrl = `${APPS_SCRIPT_WEB_APP_URL}?${params.toString()}`;

    try {
      // Dữ liệu nằm trên query string để Apps Script luôn đọc được qua e.parameter.
      await fetch(requestUrl, {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8' },
        body: 'ok=1'
      });

      showToast(`${formName} đã được ghi nhận. Bộ phận tuyển sinh sẽ liên hệ tư vấn.`);
      form.reset();
    } catch (error) {
      showToast('Không gửi được dữ liệu. Vui lòng thử lại.');
    }
  });
});

const observer = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) {
      entry.target.classList.add('visible');
      observer.unobserve(entry.target);
    }
  });
}, { threshold: 0.14 });

reveals.forEach((element) => observer.observe(element));
