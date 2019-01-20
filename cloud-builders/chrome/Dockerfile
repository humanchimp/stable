FROM ubuntu:18.04

# Application parameters and variables
ENV NODE_ENV=production
ENV HOST=0.0.0.0
ENV PORT=10001
ENV ENABLE_XVBF=true

# Configuration for Chrome
ENV CONNECTION_TIMEOUT=60000
ENV CHROME_PATH=/usr/bin/google-chrome

# Dependencies + NodeJS
RUN apt-get update && \
echo "ttf-mscorefonts-installer msttcorefonts/accepted-mscorefonts-eula select true" | debconf-set-selections && \
apt-get install -y software-properties-common &&\
apt-add-repository "deb http://archive.canonical.com/ubuntu $(lsb_release -sc) partner" && \
apt-add-repository ppa:malteworld/ppa && apt-get update && apt-get install -y \
adobe-flashplugin \
msttcorefonts \
fonts-noto-color-emoji \
fonts-noto-cjk \
fonts-liberation \
fonts-thai-tlwg \
fontconfig \
libappindicator3-1 \
pdftk \
unzip \
locales \
gconf-service \
libasound2 \
libatk1.0-0 \
libc6 \
libcairo2 \
libcups2 \
libdbus-1-3 \
libexpat1 \
libfontconfig1 \
libgcc1 \
libgconf-2-4 \
libgdk-pixbuf2.0-0 \
libglib2.0-0 \
libgtk-3-0 \
libnspr4 \
libpango-1.0-0 \
libpangocairo-1.0-0 \
libstdc++6 \
libx11-6 \
libx11-xcb1 \
libxcb1 \
libxcomposite1 \
libxcursor1 \
libxdamage1 \
libxext6 \
libxfixes3 \
libxi6 \
libxrandr2 \
libxrender1 \
libxss1 \
libxtst6 \
ca-certificates \
libappindicator1 \
libnss3 \
lsb-release \
xdg-utils \
wget \
xvfb \
curl &&\
# Install Node
curl --silent --location https://deb.nodesource.com/setup_11.x | bash - &&\
apt-get install --yes nodejs &&\
apt-get install --yes build-essential &&\
# Fonts
fc-cache -f -v

# Install yarn
RUN npm i -g yarn

# Install Chrome Stable
RUN cd /tmp &&\
wget https://dl.google.com/linux/direct/google-chrome-stable_current_amd64.deb &&\
dpkg -i google-chrome-stable_current_amd64.deb;\
fi

# Cleanup
RUN apt-get clean && rm -rf /var/lib/apt/lists/* /tmp/* /var/tmp/*

# Add user
RUN groupadd -r stablebot && useradd -r -g stablebot -G audio,video stablebot \
&& mkdir -p /home/stablebot/Downloads \
&& chown -R stablebot:stablebot /home/stablebot;

# Run everything after as non-privileged user
USER stablebot

# Expose ports for app and debugger
EXPOSE 10001
EXPOSE 9222
