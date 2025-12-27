const config = {
    env: {
        imageKiy: {
            publicKey: process.env.NEXT_PUBLIC_IMAGEKIT_PUBLIC_KEY,
            urlEndpoint: process.env.NEXT_PUBLIC_IMAGEKIT_URL_ENDPOINT,
            privatekey: process.env.NEXT_PUBLIC_IMAGEKIT_PRIVATE_KEY,
        }
    }
}

export default config
