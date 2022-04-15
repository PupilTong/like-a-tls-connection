openssl ecparam -name secp521r1  -out ca.key -genkey 
openssl req -x509 -new -nodes -key ca.key -sha256 -days 1825 -out ca.crt
openssl ecparam -name secp521r1  -out server.key -genkey 
openssl req -new -key server.key -out server.csr
openssl x509 -req -in server.csr -CA ca.crt -CAkey ca.key -CAcreateserial -out server.crt -days 10000