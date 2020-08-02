import { isObservableProp } from "mobx"

export interface IUpdatable { value?: any, updated: boolean }
export type OnValueChangeType<A extends Object> = (newValue: any, additionalData?: A) => Promise<boolean | undefined | void>
export type OnValueChangedType<A extends Object> = ((oldValue: any, newValue: any, additionalData?: A) => any) | undefined
/** 
 * all - no conversion - assigns the event.target.value or event.target.checked as is to the state
 * onlyNumbers - deprecated
 * string - string state value
 * numericString - string state value but only allows numbers
 * numeric - numeric state value
 */
export type InputPropsVariant = 'all' | 'onlyNumbers' | 'numericString' | 'numeric' | 'string'

export type InputPropsConfig = {
    /** does not allow negatives */
    onlyPositives?: boolean
    /** if variant is numeric, this defines the thousands separator (defaults to ',') */
    thousandsSeparator?: string
    /** if variant is numeric, this defines the decimals separator (defaults to '.') */
    decimalsSeparator?: string
    /** if variant is numeric, this will restrict the number of decimal places (down to 0) */
    maxDecimalPlaces?: number
    /** self explanatory */
    numberOfDecimalsAlwaysAppearing?: number
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
    /** modifier for when the element value was rendered undefined or null. input-props' default is to return "" */
    elementValueForUndefinedOrNull?: (value: any) => any
    /** if the field is a checkbox (and event.target.checked should be considered). InputProps will try to infer from usage */
    isCheckbox?: boolean
}

export function isUpdatable(v: any): v is IUpdatable {
    return (typeof (v) === 'object' && v?.hasOwnProperty('value') && v?.hasOwnProperty('updated'))
}

/**
 * similar to fieldProps, but will work with any property that is not an updatable
 * @param parentObject object that holds the property
 * @param propertyName name of the property that will be updated
 * @param onValueChange optional - callback whenever the field changes. This callback has to return true if it accepts the new value, or false if not
 */
export function fieldValueProps<T extends Object, P extends Extract<keyof T, string>, A extends Object>(
    parentObject: T,
    propertyName: P,
    onValueChange?: OnValueChangeType<A>,
    variant: InputPropsVariant = 'all',
    config: InputPropsConfig = {},
    onValueChanged: OnValueChangedType<A> = undefined,
    paramsToValueChange: A = {} as A,
): { onChange: any, value: any } {

    const getVal = () => {
        const property = parentObject[propertyName]
        if (isUpdatable(property)) {
            return property.value
        } else {
            return property
        }
    }

    const setVal = (value: any) => {
        const property = parentObject[propertyName]
        if (isUpdatable(property)) {
            property.value = value
            if (!property.updated) {
                property.updated = true
            }
        } else {
            parentObject[propertyName] = value
        }
    }
    const setValue = (value: any) => {
        const old = getVal()
        setVal(value)

        if (onValueChanged) {
            onValueChanged(old, value, paramsToValueChange)
        }
    }

    if (isUpdatable(parentObject[propertyName])) {
        if (!isObservableProp(parentObject[propertyName], 'value')) {
            throw new Error(`Property 'value' on the updatable object is not a mobx observable.`)
        }
    } else {
        if (!isObservableProp(parentObject, propertyName)) {
            throw new Error(`Property ${propertyName} is not an mobx observable.`)
        }
    }

    const onChange = async (event: any) => {
        const value = ((!event || !event.target) ? event : event.target.type === 'checkbox' ? returnCheckboxValue(event.target.checked, config.isCheckbox) : returnNormalValue(event.target.value, variant, config))
        if (getVal() !== value) {
            if (!checkValue(value, variant, config)) {
                return
            }
            if (onValueChange) {
                const valueChangeRet = await onValueChange(value, paramsToValueChange)
                if (typeof valueChangeRet !== "boolean" || valueChangeRet) {
                    setValue(value)
                }
            } else {
                setValue(value)
            }
        }
    }
    return { onChange, value: formatElementValue(getVal(), variant, config) }
}

export function formatElementValue(value: any, variant: InputPropsVariant, config: InputPropsConfig = {}) {
    if (variant === 'numeric') {
        if (value === undefined || value === null) {
            value = ""
        } else {
            value = value.toString().trim()
            if (value === "-" || value === "0.") {
                // just uses value as is
            } else if (value === ".") {
                value = "0."
            } else {
                const split = value.split('.')
                let intValue = split[0]
                const thousandsSep = config.thousandsSeparator || ','
                intValue = intValue.replace(/\B(?=(\d{3})+(?!\d))/g, thousandsSep)
                const decSep = config.decimalsSeparator || '.'

                const forceDecimals = typeof (config.numberOfDecimalsAlwaysAppearing) === 'number' && (config.numberOfDecimalsAlwaysAppearing ?? 0) > 0
                if (split.length > 1) {
                    value = intValue + decSep
                    if (forceDecimals) {
                        value += split[1].padEnd(config.numberOfDecimalsAlwaysAppearing!, '0')
                    } else {
                        value += split[1]
                    }
                } else {
                    value = intValue
                    if (forceDecimals) {
                        value += "." + "".padEnd(config.numberOfDecimalsAlwaysAppearing!, '0')
                    }
                }
            }
        }
    }
    if (config.elementValueModifiers) {
        for (const modifier of config.elementValueModifiers) {
            value = modifier(value)
        }
    }
    if (value === undefined || value === null) {
        if (config.elementValueForUndefinedOrNull) {
            return config.elementValueForUndefinedOrNull(value)
        } else {
            return ""
        }
    }
    return value
}

function returnNormalValue(value: any, variant: InputPropsVariant, config: InputPropsConfig = {}) {
    if (config.isCheckbox) {
        throw new Error("This element was configured or inferred as 'checkbox' but it's actually not because event.target.type is not equal to 'checkbox'. Either pass config.isCheckbox as false to InputProps or change the children component to an input type that is a checkbox.")
    }
    if (variant === 'numeric') {
        if (!value) {
            value = ""
        } else {
            const thousandsSep = config.thousandsSeparator || ','
            value = (value as string).toString().trim()

            if (value === '.') {
                value = "0."
            } else if (value === '0.') {
                // keep it like that
            } else {
                if (value.length > 1 && value[0] === '0' && value[1] !== '.') {
                    value = value.replace('0', '')
                }
                value = value.replace(new RegExp(thousandsSep, 'g'), '')
                const decSep = config.decimalsSeparator || '.'
                value = value.replace(decSep, '.')
            }
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
            if (value !== undefined && value !== null && value !== "" && value !== "-") {
                if (isNaN(value)) {
                    return false
                }
                if (config.maxDecimalPlaces !== undefined && countDecimals(value) > config.maxDecimalPlaces) {
                    return false
                }
                if (config.maxIntegerLength !== undefined && countIntegerLength(value) > config.maxIntegerLength) {
                    return false
                }
                if (config.onlyPositives && value < 0) {
                    return false
                }
                if (config.maxDecimalPlaces === 0 && (value || "").includes('.')) {
                    return false
                }
            } else {
                if (value === "-" && config.onlyPositives) {
                    return false
                }
            }
            break;
    }
    return true
}
