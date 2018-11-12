#!/bin/bash
openssl genrsa -out privkey.pem 2048
echo -e "[req]\nreq_extensions = v3_req\ndistinguished_name  = req_distinguished_name\n[req_distinguished_name]\ncommonName=Common Name\ncommonName_default=localhost\n[v3_req]\nbasicConstraints = CA:FALSE\nkeyUsage = nonRepudiation, digitalSignature, keyEncipherment\nsubjectAltName = @alt_names\n[alt_names]\nDNS.1 = localhost\n" >openssl.cfg
openssl req -new -x509 -days 18250 -subj "/CN=localhost" -config openssl.cfg -sha256 -key privkey.pem -out cert.pem
rm openssl.cfg
