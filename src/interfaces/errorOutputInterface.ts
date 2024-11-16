export interface IErrorOutput {
	totals: {
	  errors: number;
	  file_errors: number;
	};
	files: {
	  [filePath: string]: {
		errors: number;
		messages: {
		  message: string;
		  line: number;
		  ignorable: boolean;
		  identifier: string;
		}[];
	  };
	};
	errors: any; 
}
  