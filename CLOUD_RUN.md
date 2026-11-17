# Deploy PawHunt outside ChatGPT

The container serves the game and remote API from the same Cloud Run URL. From Google Cloud Shell, select a billing-enabled Google Cloud project and run:

```bash
git clone https://github.com/amberang1/pawws.git
cd pawws
gcloud config set run/region asia-southeast1
gcloud services enable run.googleapis.com cloudbuild.googleapis.com artifactregistry.googleapis.com
gcloud run deploy pawhunt --source . --region asia-southeast1 --allow-unauthenticated --max-instances 1 --memory 512Mi
```

Cloud Run prints the public URL. Open that URL on both devices.

Remote rooms are held in server memory: they expire after two hours, disappear on a restart or idle shutdown, and require the service to stay at one instance. This is appropriate for a prototype, but not a durable or horizontally scalable production setup. Cloud Run and build services may incur charges. Check current Google Cloud pricing and quotas for your account.
