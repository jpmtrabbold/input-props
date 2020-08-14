import { observable, action, computed } from "mobx"

type FieldType<T> = keyof T

export class FormErrorHandler<T extends any> {

    @observable errors = [] as {field: FieldType<T>, error: string}[]
    
    /** whether there's any error in any field */
    @computed get hasError() {
        return !!this.errors.length
    }

    /** use this method to add an error to field.
     * field must be the the string property name of the field in the model that you are setting the error
     */
    @action error(field: FieldType<T>, error: string) {
        this.errors.push({field, error})
    }

    /** checks whether a field has any error */
    fieldHasError(field: FieldType<T>) {
        return !!this.errors.find(item => item.field === field)
    }

    /** gets the error for any specific field */
    getFieldError(field: FieldType<T>) {
        const error = this.errors.find(item => item.field === field)
        if (error) {
            return {error: true, helperText: error.error}
        } else {
            return {error: false, helperText: ""}
        }
    }

    /** reset error for specific field */
    @action resetFieldError(field: FieldType<T>) {
        this.errors = this.errors.filter(e => e.field !== field)
    }

    /** reset all errors */
    @action reset() {
        this.errors = []
    }
}

export default FormErrorHandler