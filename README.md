# input-props
A React component that provides a two-way data-binding feel to your forms controlled by a mobx state.

## How to use

Assuming you are using an observable object/store that holds your state:
```
<InputProps stateObject={store} propertyName='fieldName'>
    <input/>
</InputProps>
```

The code above will inject the `onChange` and `value` properties into the `input` element, so it updates the state automatically.

If you need to validate the changed data:
```
<InputProps stateObject={store} propertyName='fieldName' onValueChange={(newValue) => validationFunctionThatReturnsBoolean(newValue)}>
    <input/>
</InputProps>
```

If you need to know when the data changed after the state was updated:
```
<InputProps stateObject={store} propertyName='fieldName' onValueChanged={(oldValue, newValue) => doSomethingKnowingThatTheChangeCameThrough(newValue)}>
    <input/>
</InputProps>
```

There are lots of entry points for interceptors for differents types of data, you can see all the options in the JSDoc documentation of the components.