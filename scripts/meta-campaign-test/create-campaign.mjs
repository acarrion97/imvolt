import bizSdk from 'facebook-nodejs-business-sdk';
const AdAccount = bizSdk.AdAccount;

// Variables de entorno (nunca hardcodear el token)
const access_token = process.env.META_ACCESS_TOKEN;
const ad_account_id = process.env.META_AD_ACCOUNT_ID || 'act_1118923347168196';
const campaign_name = process.env.META_CAMPAIGN_NAME || `IMVOLT test ${new Date().toISOString()}`;

if (!access_token) {
  console.error('Falta META_ACCESS_TOKEN');
  process.exit(1);
}

const api = bizSdk.FacebookAdsApi.init(access_token);
const showDebugingInfo = process.env.META_DEBUG === '1'; // OJO: el debug imprime el token en la URL
if (showDebugingInfo) {
  api.setDebug(true);
}

void (async function () {
  try {
    const fields = [];
    const params = {
      name: campaign_name,
      objective: 'OUTCOME_TRAFFIC',
      status: 'PAUSED', // no gasta dinero mientras pruebas
      special_ad_categories: [], // para inmobiliario, Meta suele exigir ['HOUSING']
      // Requerido por la API reciente cuando el presupuesto no está a nivel campaña
      is_adset_budget_sharing_enabled: false,
    };
    // META_VALIDATE_ONLY=1 → Meta valida la petición pero NO crea la campaña
    if (process.env.META_VALIDATE_ONLY === '1') {
      params.execution_options = ['validate_only'];
    }
    const campaign = await new AdAccount(ad_account_id).createCampaign(fields, params);
    if (params.execution_options) {
      console.log('Validación OK (no se creó nada).');
    } else {
      console.log('Campaña creada, campaign_id: ' + campaign.id);
    }
  } catch (error) {
    console.log(error);
    process.exit(1);
  }
})();
