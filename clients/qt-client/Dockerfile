FROM ubuntu:22.04

# Install dependencies
RUN apt-get update && apt-get install -y \
    build-essential \
    cmake \
    ninja-build \
    pkg-config \
    libgl1-mesa-dev \
    libglu1-mesa-dev \
    libx11-dev \
    libxext-dev \
    libxfixes-dev \
    libxi-dev \
    libxrender-dev \
    libxcb1-dev \
    libx11-xcb-dev \
    libxcb-glx0-dev \
    libxcb-keysyms1-dev \
    libxcb-image0-dev \
    libxcb-shm0-dev \
    libxcb-icccm4-dev \
    libxcb-sync-dev \
    libxcb-xfixes0-dev \
    libxcb-shape0-dev \
    libxcb-randr0-dev \
    libxcb-render-util0-dev \
    libxcb-util-dev \
    libxcb-xinerama0-dev \
    libxcb-xkb-dev \
    libxkbcommon-x11-dev \
    libfontconfig1-dev \
    libfreetype6-dev \
    wget \
    && rm -rf /var/lib/apt/lists/*

# Install Qt 6.9.3
WORKDIR /opt
RUN wget https://download.qt.io/official_releases/qt/6.9/6.9.3/qt-opensource-linux-x64-6.9.3.run
RUN chmod +x qt-opensource-linux-x64-6.9.3.run

# Set environment
ENV PATH="/opt/qt/6.9.3/gcc_64/bin:$PATH"
ENV CMAKE_PREFIX_PATH="/opt/qt/6.9.3/gcc_64"

WORKDIR /workspace
COPY . .

# Build
RUN mkdir build && cd build && \
    cmake .. -DCMAKE_BUILD_TYPE=Release && \
    cmake --build . --config Release

CMD ["/workspace/build/SysManagePro"]