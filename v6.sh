#!/bin/bash
sudo bash -c 'cat << EOF > /etc/docker/daemon.json
{
  "ipv6": true,
  "fixed-cidr-v6": "fd00::/80",
  "experimental": true,
  "ip6tables": true
}
EOF'
sudo systemctl restart docker
