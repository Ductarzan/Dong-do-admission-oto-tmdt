const toast = document.querySelector('.toast');
const forms = document.querySelectorAll('form[data-form-name]');
const reveals = document.querySelectorAll('.reveal');
const popupTriggers = document.querySelectorAll('[data-open-popup]');
const popupCloseButtons = document.querySelectorAll('[data-close-popup]');

// Thay URL này bằng URL Web App sau khi deploy Apps Script.
const APPS_SCRIPT_WEB_APP_URL = 'https://script.google.com/macros/s/AKfycbzw06zfthu5zoU6ADSqHgmyzjAi8mJIbbW0djWs0gzL2q8vTSGvGaIzXZt7EDiJ1SDg/exec';
const LIENTHONG_APPS_SCRIPT_WEB_APP_URL = 'https://script.google.com/macros/s/AKfycbzQ_p80yq0Dkrv73ctocaG3EYVWK44N3YqO6Wtsaw0upaWglWZQ5og7lQty7NO3W7nl/exec';
const THANK_YOU_URLS = {
  chinh_quy: 'thankyou=chinhquy',
  lien_thong: 'thankyou=lienthong',
  nganh_khac: 'thankyou=nganhkhac'
};

function showToast(message) {
  toast.textContent = message;
  toast.classList.add('show');
  window.clearTimeout(showToast.timer);
  showToast.timer = window.setTimeout(() => toast.classList.remove('show'), 3600);
}

function openPopup(id) {
  const popup = document.getElementById(id);
  if (!popup) return;
  popup.classList.add('open');
  popup.setAttribute('aria-hidden', 'false');
  document.body.style.overflow = 'hidden';
}

function closePopup(popup) {
  if (!popup) return;
  popup.classList.remove('open');
  popup.setAttribute('aria-hidden', 'true');
  document.body.style.overflow = '';
}

popupTriggers.forEach((button) => {
  button.addEventListener('click', (event) => {
    event.preventDefault();
    const popupId = button.getAttribute('data-open-popup');
    if (popupId) openPopup(popupId);
  });
});

popupCloseButtons.forEach((button) => {
  button.addEventListener('click', () => {
    const popup = button.closest('.popup-overlay');
    closePopup(popup);
  });
});

document.querySelectorAll('.popup-overlay').forEach((popup) => {
  popup.addEventListener('click', (event) => {
    if (event.target === popup) closePopup(popup);
  });
});

document.addEventListener('keydown', (event) => {
  if (event.key !== 'Escape') return;
  const openedPopup = document.querySelector('.popup-overlay.open');
  if (openedPopup) closePopup(openedPopup);
});

function showSuccessPopupFromUrl() {
  const url = new URL(window.location.href);
  const thankYouValue = url.searchParams.get('thankyou');
  if (!thankYouValue) return;

  openPopup('success-popup');

  // Lam sach URL sau khi hien popup thanh cong.
  url.searchParams.delete('thankyou');
  const cleanUrl = `${url.pathname}${url.search}${url.hash}`;
  window.history.replaceState({}, '', cleanUrl);
}

forms.forEach((form) => {
  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    if (!form.checkValidity()) {
      form.reportValidity();
      return;
    }

    const formName = form.dataset.formName || 'Form đăng ký';
    const webhookType = form.dataset.webhook || 'chinhquy';
    const isLienThongForm = webhookType === 'lienthong';
    const webhookUrl = isLienThongForm ? LIENTHONG_APPS_SCRIPT_WEB_APP_URL : APPS_SCRIPT_WEB_APP_URL;
    const leadType = form.dataset.leadType || (isLienThongForm ? 'lien_thong' : 'chinh_quy');

    if (!webhookUrl || webhookUrl.includes('PASTE_YOUR_APPS_SCRIPT_WEB_APP_URL_HERE')) {
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

    // Tuong thich voi sheet cu: neu chi co full_name thi bo sung name.
    if (!params.get('name') && params.get('full_name')) {
      params.set('name', params.get('full_name'));
    }

    if (isLienThongForm) {
      // Tuong thich voi cac sheet/appscript dang dung bo cot cu.
      if (!params.get('method')) {
        params.set('method', params.get('training_system') || '');
      }
      if (!params.get('gpa_sum')) {
        params.set('gpa_sum', '');
      }
    }

    const requestUrl = `${webhookUrl}?${params.toString()}`;

    try {
      // Dữ liệu nằm trên query string để Apps Script luôn đọc được qua e.parameter.
      await fetch(requestUrl, {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8' },
        body: 'ok=1'
      });

      if (typeof window.fbq === 'function') {
        window.fbq('track', 'Lead', {
          content_name: formName,
          lead_type: leadType
        });
      }

      showToast(`${formName} đã được ghi nhận. Bộ phận tuyển sinh sẽ liên hệ tư vấn.`);
      form.reset();
      const popup = form.closest('.popup-overlay');
      if (popup) closePopup(popup);

      const thankYouQuery = THANK_YOU_URLS[leadType];
      if (thankYouQuery) {
        window.setTimeout(() => {
          const base = window.location.origin + window.location.pathname;
          window.location.href = `${base}?${thankYouQuery}`;
        }, 250);
      }
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

showSuccessPopupFromUrl();
