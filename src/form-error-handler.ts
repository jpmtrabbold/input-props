import { observable } from "mobx"

type FieldType<T> = keyof T | any

export default class FormErrorHandler<T extends any> {

    @observable errors = [] as {field: FieldType<T>, error: string}[]
    hasError = false

    error(field: FieldType<T>, error: string) {
        this.errors.push({field, error})
        this.hasError = true
    }

    fieldHasError(field: FieldType<T>) {
        return !!this.errors.find(item => item.field === field)
    }

    getFieldError(field: FieldType<T>) {
        const error = this.errors.find(item => item.field === field)
        if (error) {
            return {error: true, helperText: error.error}
        } else {
            return {error: false, helperText: ""}
        }
    }

    reset() {
        this.errors = []
        this.hasError = false
    }
}