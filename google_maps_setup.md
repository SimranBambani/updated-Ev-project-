# Google Maps Platform - Integration and Setup Guide

To load the interactive map and calculate EV routing on the **VoltFlow** dashboard, you need a Google Maps Platform API key. Follow these instructions to set it up:

---

## 1. Google Cloud Project Creation
1. Go to the [Google Cloud Console](https://console.cloud.google.com/).
2. Click the project dropdown in the top navigation bar and select **New Project**.
3. Name your project (e.g., `VoltFlow-EV-Charging`) and click **Create**.

## 2. Billing Setup
> [!IMPORTANT]
> Google Maps Platform APIs require an active billing account, even though you get $200 of free monthly credits (which is more than enough for testing and local development).
1. Navigate to the **Billing** section in the Cloud Console sidebar.
2. Link an existing billing account or click **Add billing account** and complete the verification steps.

## 3. API Enablement
To calculate driving routes, display markers, and center on the user's location, you must enable the following APIs:
1. Go to the **APIs & Services > Library** page in the console.
2. Search for and click **Enable** on the following three APIs:
   - **Maps JavaScript API** (for loading the map and markers)
   - **Directions API** (for rendering routes between user and stations)
   - **Distance Matrix API** (for computing estimated travel times)

## 4. API Key Creation
1. Navigate to **APIs & Services > Credentials** in the Cloud Console sidebar.
2. Click **+ Create Credentials** at the top and select **API key**.
3. Copy the generated key.

## 5. Security & Key Restrictions
> [!WARNING]
> To prevent unauthorized usage of your API key and avoid unexpected billing charges, you should restrict the key immediately.

1. Under the **API keys** list, click on your newly created key to edit it.
2. Under **Application restrictions**:
   - Select **Web sites (HTTP referrers)**.
3. Under **Website restrictions**, add referrers for your environment:
   - **Localhost Testing**: Add `http://localhost:3000/*` and `http://127.0.5.1:3000/*`.
   - **Production (Staging/Live)**: Add `https://your-domain.com/*` (replace with your host URL).
4. Under **API restrictions**:
   - Select **Restrict key**.
   - Check **Maps JavaScript API**, **Directions API**, and **Distance Matrix API**.
5. Click **Save**.

---

## 6. Configuring Environment Variables
Open the [.env](file:///e:/EV_PROJECT/EV_project/.env) file in the root of the project and replace the placeholder API key with your restricted key:

```env
VITE_API_URL=http://localhost:5000/api
VITE_GOOGLE_MAPS_API_KEY=YOUR_RESTRICTED_GOOGLE_MAPS_API_KEY
```

Restart your Vite development server (`npm run dev`) after changing the `.env` file to apply the key.
