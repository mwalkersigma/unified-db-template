printf "\n******************************\n"
echo "Project Start Script V1"
printf "******************************\n"

printf "\n******************************\n"
echo "Verifying Node and NPM"
printf "******************************\n"

if ! [ -x "$(command -v node)" ]; then
  echo 'Error: node is not installed.' >&2
  curl https://raw.githubusercontent.com/creationix/nvm/master/install.sh | bash

  export NVM_DIR="$HOME/.nvm"
  [ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"  # This loads nvm
  [ -s "$NVM_DIR/bash_completion" ] && \. "$NVM_DIR/bash_completion"

  nvm install node
fi

# Example
# npx next start -H 10.100.100.51 -p 3008
npx next start -H [Server_IP] -p [Port]