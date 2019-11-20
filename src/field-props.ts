import { isObservableProp } from "mobx"

export interface IUpdatable { value?: any, updated: boolean }
export type OnValueChangeType = (newValue: any) => Promise<boolean | undefined | void>
/** 
 * all - no conversion - assigns the event.target.value or event.target.checked as is to the state
 * onlyNumbers - deprecated
 * string - string state value
 * numericString - string state value but only allows numbers
 * numeric - numeric state value
 */
export type InputPropsVariant = 'all' | 'onlyNumbers' | 'numericString' | 'numeric' | 'string'

export type InputPropsConfig = {
    /** if variant is numeric, this defines the thousands separator (defaults to ',') */
    thousandsSeparator?: string
    /** if variant is numeric, this defines the decimals separator (defaults to '.') */
    decimalsSeparator?: string
    /** if variant is numeric, this will restrict the number of decimal places (down to 0) */
    maxDecimalPlaces?: number
    /** if variant is numeric, this will restrict the number of integer places */
    maxIntegerLength?: number
    /** functions to validate every key stroke. If any of them returns false, the key stroke does not come through as a change to the state
     * hint: create your own set of reusable restrictors!
     */
    valueRestrictors?: ((value: any) => boolean)[]
    /** functions that will be called to format the value that will be shown in the element - good for formatting 
     * hint: create your own set of reusable modifiers!
    */
    elementValueModifiers?: ((value: any) => string)[]
    /** functions that will be called to modify the value that will be assigned to the state - good for undoing formatting 
     * hint: create your own set of reusable modifiers!
    */
    stateModifiers?: ((value: any) => string)[]
    /** if the field is a checkbox (and event.target.checked should be considered). InputProps will try to infer from usage */
    isCheckbox?: boolean
}

export default function fieldProps(updatableObject: IUpdatable, onValueChange?: OnValueChangeType, variant: InputPropsVariant = 'all', config: InputPropsConfig = {}): { onChange: any, value: any } {

    const setValue = (value: any) => {
        updatableObject.value = value

        if (!updatableObject.updated)
            updatableObject.updated = true
    }

    if (!isObservableProp(updatableObject, 'value')) {
        throw new Error(`Property 'value' on the updatable object is not a mobx observable.`)
    }

    const onChange = async (event: any) => {
        if (event === undefined || event == null) {
            return
        }
        const value = (!event.target ? event : event.target.type === 'checkbox' ? returnCheckboxValue(event.target.checked, config.isCheckbox) : returnNormalValue(event.target.value, variant, config))
        if (updatableObject.value !== value) {
            if (!checkValue(value, variant, config)) {
                return
            }
            if (onValueChange) {
                const valueChangeRet = await onValueChange(value)
                if (typeof valueChangeRet !== "boolean" || valueChangeRet) {
                    setValue(value)
                }
            } else {
                setValue(value)
            }
        }
    }
    return { onChange, value: changeElementValue(updatableObject.value, variant, config) }
}

/**
 * similar to fieldProps, but will work with any property that is not an updatable
 * @param parentObject object that holds the property
 * @param propertyName name of the property that will be updated
 * @param onValueChange optional - callback whenever the field changes. This callback has to return true if it accepts the new value, or false if not
 */
export function fieldValueProps<T extends Object, P extends Extract<keyof T, string>>(parentObject: T, propertyName: P, onValueChange?: OnValueChangeType, variant: InputPropsVariant = 'all', config: InputPropsConfig = {}): { onChange: any, value: any } {

    const setValue = (value: any) => {
        parentObject[propertyName] = value
    }

    if (!isObservableProp(parentObject, propertyName)) {
        throw new Error(`Property ${propertyName} is not an mobx observable.`)
    }

    const onChange = async (event: any) => {
        if (event === undefined || event == null) {
            return
        }
        const value = (!event.target ? event : event.target.type === 'checkbox' ? returnCheckboxValue(event.target.checked, config.isCheckbox) : returnNormalValue(event.target.value, variant, config))
        if (parentObject[propertyName] !== value) {
            if (!checkValue(value, variant, config)) {
                return
            }
            if (onValueChange) {
                const valueChangeRet = await onValueChange(value)
                if (typeof valueChangeRet !== "boolean" || valueChangeRet) {
                    setValue(value)
                }
            } else {
                setValue(value)
            }
        }
    }
    return { onChange, value: changeElementValue(parentObject[propertyName], variant, config) }
}

function changeElementValue(value: any, variant: InputPropsVariant, config: InputPropsConfig = {}) {
    if (variant === 'numeric') {
        if (value === undefined) {
            value = ""
        } else {
            value = value.toString().trim()
            const split = value.split('.')
            let intValue = split[0]
            const thousandsSep = config.thousandsSeparator || ','
            intValue = intValue.replace(/\B(?=(\d{3})+(?!\d))/g, thousandsSep)
            const decSep = config.decimalsSeparator || '.'
            if (split.length > 1) {
                value = intValue + decSep + split[1]
            } else {
                value = intValue
            }
        }
    }
    if (config.elementValueModifiers) {
        for (const modifier of config.elementValueModifiers) {
            value = modifier(value)
        }
    }
    return (value === undefined ? null : value)
}

function returnNormalValue(value: any, variant: InputPropsVariant, config: InputPropsConfig = {}) {
    if (config.isCheckbox) {
        throw new Error("This element was configured or inferred as 'checkbox' but it's actually not because event.target.type is not equal to 'checkbox'. Either pass config.isCheckbox as false to InputProps or change the children component to an input type that is a checkbox.")
    }
    if (variant === 'numeric') {
        if (!value) {
            value = undefined
        } else {
            const thousandsSep = config.thousandsSeparator || ','
            value = (value as string).toString().trim()
            if (value.length > 1 && value[0] === '0') {
                value = value.replace('0','')
            }
            value = value.replace(new RegExp(thousandsSep, 'g'), '')
            const decSep = config.decimalsSeparator || '.'
            value = value.replace(decSep, '.')
        }
    }
    if (config.stateModifiers) {
        for (const modifier of config.stateModifiers) {
            value = modifier(value)
        }
    }
    return value
}

function returnCheckboxValue(value: any, shouldBeCheckbox?: boolean) {
    if (!shouldBeCheckbox) {
        throw new Error("This element was configured or inferred as not being a 'checkbox' but it actually is because event.target.type is equal to 'checkbox'. Either pass config.isCheckbox as true to InputProps or change the children component to an input type that is not a checkbox.")
    }
    return value
}

function countDecimals(number: number) {
    if (Math.floor(number.valueOf()) === number.valueOf()) return 0;
    const split = number.toString().split(".")
    return (split.length > 1 && split[1].length) || 0;
}

function countIntegerLength(number: number) {
    const split = number.toString().split(".")
    return (split[0].length) || 0;
}

function checkValue(value: any, variant: InputPropsVariant, config: InputPropsConfig = {}) {

    if (!!config.valueRestrictors) {
        for (const restrictor of config.valueRestrictors) {
            if (!restrictor(value)) {
                return false
            }
        }
    }

    switch (variant) {
        case 'onlyNumbers':
        case 'numericString':
        case 'numeric':
            if (value !== undefined && value !== "") {
                if (isNaN(value)) {
                    return false
                }
                if (config.maxDecimalPlaces !== undefined && countDecimals(value) > config.maxDecimalPlaces) {
                    return false
                }
                if (config.maxIntegerLength !== undefined && countIntegerLength(value) > config.maxIntegerLength) {
                    return false
                }
            }
            break;
    }
    return true
}
