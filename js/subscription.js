/**
 * Tesla Sound Simulator - Subscription & Paywall Engine
 * Pricing: $5/month or $50/year (2 months free / ~17% discount)
 */
(function(window) {
  'use strict';

  const STORAGE_KEY = 'tesla_sound_pro_v1';
  const PLAN_KEY = 'tesla_sound_plan_v1';
  const VALID_PROMOS = ['PRO2026', 'VIP2026', 'TESLA', 'FOUNDER', 'SUPERCARS', 'SPEED'];

  class SubscriptionManager {
    constructor() {
      this.isPro = localStorage.getItem(STORAGE_KEY) === 'active';
      this.currentPlan = localStorage.getItem(PLAN_KEY) || 'yearly'; // Default to yearly (best value)
    }

    init() {
      this.bindEvents();
      this.updateUI();
    }

    bindEvents() {
      // Pro upgrade button in header
      const proBtn = document.getElementById('proUpgradeBtn');
      if (proBtn) {
        proBtn.addEventListener('click', () => this.openModal());
      }

      // Close modal button
      const closeBtn = document.getElementById('closeSubModalBtn');
      if (closeBtn) {
        closeBtn.addEventListener('click', () => this.closeModal());
      }

      // Modal overlay click
      const modal = document.getElementById('subscriptionModal');
      if (modal) {
        modal.addEventListener('click', (e) => {
          if (e.target === modal) this.closeModal();
        });
      }

      // Plan Toggle Switch (Monthly vs Yearly)
      const planMonthly = document.getElementById('planToggleMonthly');
      const planYearly = document.getElementById('planToggleYearly');
      if (planMonthly && planYearly) {
        planMonthly.addEventListener('click', () => this.selectPlan('monthly'));
        planYearly.addEventListener('click', () => this.selectPlan('yearly'));
      }

      // Promo Code Activation
      const applyPromoBtn = document.getElementById('applyPromoBtn');
      const promoInput = document.getElementById('subPromoInput');
      if (applyPromoBtn && promoInput) {
        applyPromoBtn.addEventListener('click', () => this.applyPromo(promoInput.value));
        promoInput.addEventListener('keydown', (e) => {
          if (e.key === 'Enter') this.applyPromo(promoInput.value);
        });
      }

      // Checkout Button
      const checkoutBtn = document.getElementById('subCheckoutBtn');
      if (checkoutBtn) {
        checkoutBtn.addEventListener('click', () => this.handleCheckout());
      }

      // React to language changes
      window.addEventListener('languageChanged', () => {
        this.updateUI();
      });
    }

    openModal() {
      const modal = document.getElementById('subscriptionModal');
      if (modal) {
        modal.classList.add('show');
        this.updateModalPricing();
      }
    }

    closeModal() {
      const modal = document.getElementById('subscriptionModal');
      if (modal) {
        modal.classList.remove('show');
      }
    }

    selectPlan(plan) {
      this.currentPlan = plan;
      try {
        localStorage.setItem(PLAN_KEY, plan);
      } catch (e) {}
      this.updateModalPricing();
    }

    updateModalPricing() {
      const isYearly = this.currentPlan === 'yearly';
      const toggleMonthly = document.getElementById('planToggleMonthly');
      const toggleYearly = document.getElementById('planToggleYearly');
      const priceVal = document.getElementById('subDisplayPrice');
      const pricePeriod = document.getElementById('subDisplayPeriod');
      const checkoutBtn = document.getElementById('subCheckoutBtn');

      if (toggleMonthly && toggleYearly) {
        toggleMonthly.classList.toggle('active', !isYearly);
        toggleYearly.classList.toggle('active', isYearly);
      }

      const t = (key, fallback) => (window.i18n ? window.i18n.t(key, fallback) : fallback);

      if (priceVal && pricePeriod && checkoutBtn) {
        if (isYearly) {
          priceVal.textContent = t('sub_price_year', '$50');
          pricePeriod.textContent = t('sub_per_year', '/ year ($4.17/mo)');
          checkoutBtn.textContent = t('sub_cta_yearly', 'Get Annual PRO for $50 (Save $10)');
        } else {
          priceVal.textContent = t('sub_price_month', '$5');
          pricePeriod.textContent = t('sub_per_month', '/ month');
          checkoutBtn.textContent = t('sub_cta_monthly', 'Subscribe for $5 / Month');
        }
      }
    }

    handleCheckout() {
      const statusEl = document.getElementById('subFeedbackMsg');
      const t = (key, fallback) => (window.i18n ? window.i18n.t(key, fallback) : fallback);

      if (this.isPro) {
        if (statusEl) {
          statusEl.textContent = '✅ ' + t('btn_pro_active', '👑 PRO ACTIVE');
          statusEl.style.color = '#00e676';
        }
        return;
      }

      // Ready for payment gateway (Stripe Checkout / LemonSqueezy / Paddle)
      if (statusEl) {
        statusEl.innerHTML = `💳 ${t('sub_checkout_notice', 'Stripe checkout integration ready. Enter PRO2026 for instant demo unlock!')}`;
        statusEl.style.color = '#ffaa00';
      }
    }

    applyPromo(code) {
      const clean = (code || '').trim().toUpperCase();
      const statusEl = document.getElementById('subFeedbackMsg');
      const t = (key, fallback) => (window.i18n ? window.i18n.t(key, fallback) : fallback);

      if (VALID_PROMOS.includes(clean)) {
        this.isPro = true;
        try {
          localStorage.setItem(STORAGE_KEY, 'active');
        } catch (e) {}

        if (statusEl) {
          statusEl.textContent = t('sub_promo_applied', '🎉 Promo code accepted! PRO mode unlocked.');
          statusEl.style.color = '#00e676';
        }

        this.updateUI();

        setTimeout(() => {
          this.closeModal();
        }, 1200);
      } else {
        if (statusEl) {
          statusEl.textContent = t('sub_promo_invalid', '❌ Invalid promo code. Try PRO2026');
          statusEl.style.color = '#ff3333';
        }
      }
    }

    updateUI() {
      const proBtn = document.getElementById('proUpgradeBtn');
      const t = (key, fallback) => (window.i18n ? window.i18n.t(key, fallback) : fallback);

      if (proBtn) {
        if (this.isPro) {
          proBtn.textContent = t('btn_pro_active', '👑 PRO ACTIVE');
          proBtn.className = 'btn-pro-badge is-active';
        } else {
          proBtn.textContent = t('btn_pro', '⭐ PRO ($5/mo)');
          proBtn.className = 'btn-pro-badge';
        }
      }
    }
  }

  window.subscription = new SubscriptionManager();

})(window);
