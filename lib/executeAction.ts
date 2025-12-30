const isRedirectError = (error: any) => {
    return error?.digest?.toString().startsWith('NEXT_REDIRECT') || 
           error?.message === 'NEXT_REDIRECT';
};

type Options<T> = {
    actionFn: () => Promise<T>;
    successMessage?: string;
};

const executeAction = async <T> ({
    actionFn,
    successMessage = "Action completed successfully",
}: Options<T>) : Promise<{success: boolean; message: string}> => {
    try {
        await actionFn ();
        return {
            success: true,
            message: successMessage,
        }
    } catch (error) {
        console.log("ExecuteAction caught error:", error);
        if (isRedirectError(error)) {
            console.log("Rethrowing redirect error");
            throw error;
        }
        return {
            success: false,
            message: "An unknown error occurred",
        }
    }
};

export { executeAction }