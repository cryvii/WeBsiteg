# Cloudflare Tunnel Setup for Self-Hosting

Cloudflare Tunnel allows you to securely expose your self-hosted application to the internet without opening ports on your firewall.

## Prerequisites
1.  A Cloudflare account.
2.  A domain name added to Cloudflare.
3.  `cloudflared` installed on your server (or use the Docker method).

## Method 1: Using Docker (Recommended)

We can add `cloudflared` as a service in our `docker-compose.prod.yml`.

1.  **Get a Tunnel Token**:
    - Go to Zero Trust Dashboard > Access > Tunnels.
    - Create a new tunnel.
    - Copy the token provided (it looks like `eyJh...`).

2.  **Run with Tunnel**:
    You can run a temporary tunnel command alongside your app:
    ```bash
    docker run --network host cloudflare/cloudflared:latest tunnel --url http://localhost:3000
    ```
    *Note: This creates a random URL.*

    **For a permanent domain:**
    Update `docker-compose.prod.yml` to include the tunnel service:

    ```yaml
    services:
      # ... other services ...
      tunnel:
        image: cloudflare/cloudflared:latest
        restart: always
        command: tunnel run
        environment:
          - TUNNEL_TOKEN=your_token_here
    ```

## Method 2: Using CLI (Host Machine)

If you have `cloudflared` installed on your server:

1.  **Login**:
    ```bash
    cloudflared tunnel login
    ```

2.  **Create a Tunnel**:
    ```bash
    cloudflared tunnel create seasonal-bunker
    ```

3.  **Configure DNS**:
    Route traffic from your domain to the tunnel:
    ```bash
    cloudflared tunnel route dns seasonal-bunker app.yourdomain.com
    ```

4.  **Run the Tunnel**:
    Point it to your local app port (3000):
    ```bash
    cloudflared tunnel run --url http://localhost:3000 seasonal-bunker
    ```

## Quick Start Script
We have provided a script to quickly start the app and a temporary tunnel for testing:
```bash
./scripts/start-with-tunnel.sh
```
