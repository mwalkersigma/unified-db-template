#check if node and npm are installed
printf "\n******************************\n"
echo "Project Update Script V1"
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

printf "\n******************************\n"
echo "Node and NPM are installed navigating to project directory"
printf "******************************\n"


# Change this to navigate to the project directory
cd /home/devuser/ || exit

changed=0
git remote update && git status -uno | grep -q 'Your branch is behind' && changed=1
if [ $changed = 1 ]; then
        printf "\n******************************\n"
        echo "Project is behind, updating..."
        printf "******************************\n"
        git pull
        printf "\n******************************\n"
        echo "Pull complete updating node_modules"
        printf "******************************\n"
        npm i -ci
        printf "\n******************************\n"
        echo "Modules updated, Starting the build process in the build directory"
        printf "******************************\n"
        npm run build
        printf "\n******************************\n"
        echo "Build complete. Moving from staging directory to production"
        printf "******************************\n"
        rsync -a --delete build/ .next/
        printf "\n******************************\n"
        echo "Move Complete. Cleaning up build directory"
        printf "******************************\n"
        rm -rf build
        printf "\n******************************\n"
        echo "Clean up complete"
        printf "******************************\n"

        printf "\n******************************\n"
	      echo "Restart Application"
        printf "******************************\n"
        # Example systemctl restart comp.dev.service
        systemctl restart myservice.service
else
        echo "Project is up to date"
fi

printf "\n******************************\n"
echo "Script Finished Successfully"
printf "******************************\n"