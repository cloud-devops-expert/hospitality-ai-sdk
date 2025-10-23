#!/usr/bin/env python3
"""
mDNS Service Advertiser for AWS IoT Greengrass

Advertises the Greengrass server as "greengrass.local" on the local network
so staff devices can automatically discover and connect to it.

Service: _hospitality._tcp.local.
Hostname: greengrass.local
Port: 8000 (API gateway)

This allows staff web/mobile apps to discover the Greengrass server without
needing manual IP configuration.
"""

import logging
import socket
import time
from zeroconf import ServiceInfo, Zeroconf
from typing import Dict

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


def get_local_ip() -> str:
    """
    Get the local IP address of this machine.

    Returns:
        str: Local IP address (e.g., "192.168.20.10")
    """
    try:
        # Create a socket and connect to a remote host (doesn't actually send data)
        s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        s.connect(("8.8.8.8", 80))  # Google DNS
        local_ip = s.getsockname()[0]
        s.close()
        return local_ip
    except Exception as e:
        logger.error(f"Failed to get local IP: {e}")
        return "127.0.0.1"


def advertise_service(
    service_name: str = "Hospitality AI - Greengrass",
    service_type: str = "_hospitality._tcp.local.",
    port: int = 8000,
    properties: Dict[str, str] = None
) -> Zeroconf:
    """
    Advertise this Greengrass server via mDNS/Bonjour.

    Args:
        service_name: Friendly name shown to users
        service_type: mDNS service type (must end with .local.)
        port: API server port
        properties: Additional service metadata

    Returns:
        Zeroconf: zeroconf instance (keep alive to maintain advertisement)
    """
    if properties is None:
        properties = {
            'version': '1.0.0',
            'api': 'v1',
            'manufacturer': 'Hospitality AI SDK',
            'model': 'Greengrass Core v2',
        }

    # Get local IP address
    local_ip = get_local_ip()
    logger.info(f"Local IP address: {local_ip}")

    # Convert IP to bytes (required by zeroconf)
    ip_parts = [int(part) for part in local_ip.split('.')]
    ip_bytes = bytes(ip_parts)

    # Create service info
    service_info = ServiceInfo(
        type_=service_type,
        name=f"{service_name}.{service_type}",
        addresses=[ip_bytes],
        port=port,
        properties=properties,
        server="greengrass.local.",  # This is the hostname!
    )

    # Start zeroconf
    zeroconf = Zeroconf()

    try:
        logger.info(f"Advertising mDNS service: {service_name}")
        logger.info(f"  Type: {service_type}")
        logger.info(f"  Hostname: greengrass.local")
        logger.info(f"  IP: {local_ip}")
        logger.info(f"  Port: {port}")
        logger.info(f"  Properties: {properties}")

        zeroconf.register_service(service_info)

        logger.info("mDNS service successfully advertised!")
        logger.info("Staff devices can now discover this server as 'greengrass.local'")

        return zeroconf

    except Exception as e:
        logger.error(f"Failed to advertise mDNS service: {e}")
        zeroconf.close()
        raise


def main():
    """
    Main entry point for the mDNS advertiser service.

    Runs continuously, advertising the Greengrass server on the local network.
    """
    logger.info("Starting mDNS advertiser for Greengrass...")

    # Service properties (metadata shown to clients)
    properties = {
        'version': '1.0.0',
        'api': 'v1',
        'endpoints': 'sentiment,vision,speech,allocation,forecast',
        'manufacturer': 'Hospitality AI SDK',
        'model': 'AWS IoT Greengrass Core v2',
        'security': 'network-isolated',  # Only works on property network
    }

    try:
        # Start advertising
        zeroconf = advertise_service(
            service_name="Hospitality AI - Greengrass",
            service_type="_hospitality._tcp.local.",
            port=8000,
            properties=properties
        )

        # Keep service alive
        logger.info("mDNS advertiser running. Press Ctrl+C to stop.")

        # Run forever (until Greengrass stops the component)
        while True:
            time.sleep(10)

            # Periodic heartbeat log
            logger.debug("mDNS service still advertising...")

    except KeyboardInterrupt:
        logger.info("Received shutdown signal, stopping mDNS advertiser...")
        zeroconf.unregister_all_services()
        zeroconf.close()
        logger.info("mDNS advertiser stopped.")

    except Exception as e:
        logger.error(f"mDNS advertiser crashed: {e}", exc_info=True)
        raise


if __name__ == "__main__":
    main()
