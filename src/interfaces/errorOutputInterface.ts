export interface IErrorOutput {
	totals: {
	  errors: number;
	  file_errors: number;
	};
	files: {
	  [filePath: string]: {
		errors: number;
		messages: IErrorMessage[];
	  };
	};
	errors: any; 
}

export interface IErrorMessage {
	message: string;
	line: number;
	ignorable: boolean;
	identifier: string;
}