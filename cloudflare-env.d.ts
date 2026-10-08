declare namespace Cloudflare {
  interface Env {
    DB?: D1Database;
    BUCKET?: R2Bucket;
    ARCEUZ_OWNER_EMAIL?: string;
  }
}
